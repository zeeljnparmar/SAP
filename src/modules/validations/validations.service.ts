import { Injectable } from '@nestjs/common';
import { Attribute, CreateNewRequest, MetaData, ProductClassification } from 'src/dtos/new.new.sku.dto';
import { BusinessDataModelService } from '../interservice/business.data.model.service';
import { CommonService } from '../common/common.service';
import { DEFAULT_LANGUAGE } from 'src/constants/constants';
let regexForHTML = /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/
@Injectable()
export class ValidationService {

    constructor(
        private readonly businessDataModel:BusinessDataModelService,
        private readonly commonService:CommonService
    ){}
    
    async createNewRequestValidation(body:CreateNewRequest){
        let errorMessages:string[] = []
        if(Object.keys(body.classification.variants).length!=0){
            const colorVariant = body.classification.variants.color
            const otherVariant = body.classification.variants.other
            const sizeVariant = body.classification.variants.size

            if(colorVariant===null && sizeVariant===null && otherVariant.length===0)
                errorMessages.push(`Please Select atleast one attribute to create variant on`)
        
        }
        return errorMessages
    }

    async bulkUploadMetadataValidation(exsitingProductMetadata:ProductClassification, sheetProductMetadata:ProductClassification){
        let errorMessages = []
        if(exsitingProductMetadata.classification!=sheetProductMetadata.classification)
            errorMessages.push(`Cannot change type of product i.e. Normal to Style or Style to Variant`)
        if(exsitingProductMetadata.color_variant!=sheetProductMetadata.color_variant)
            errorMessages.push(`Cannot change Color Variant Attribute`)
        if(exsitingProductMetadata.size_variant!=sheetProductMetadata.size_variant)
            errorMessages.push(`Cannot change Size Variant Attribute`)
        if(JSON.stringify(exsitingProductMetadata.other_variant.sort())!=JSON.stringify(sheetProductMetadata.other_variant.sort()))
            errorMessages.push(`Cannot change Other Variant Attribute`)
        return errorMessages
    }

    //^ Function in which Object in parameter is changed
    async productDataValidation(productData:any, categoryId:number, metaData:MetaData, attributes?:Attribute[], convertReferenceValuesToId?:boolean){
        const possibleDefaultKeys = ['id', 'pdm_id', 'parent_pdm_id', 'possible_variants', 'variant_deleted']
        if(attributes===undefined){
            const rawPdm = await this.businessDataModel.getCategoryPDMNew(categoryId, metaData)
            attributes = await this.commonService.getFlattenedAttributes(rawPdm)
        }
        const errorMessages:string[] = []
        for(let attributeDbName in productData){
            const value = productData[attributeDbName]
            if(attributeDbName==='status' || attributeDbName==='static_mrp')
                continue
            if(value===undefined || value==='' || value===null || possibleDefaultKeys.includes(attributeDbName))
                continue
            const attribute = attributes.find(x=>x.attribute_db_name===attributeDbName)
            if(attribute===undefined && attributeDbName!='status'){
                delete productData[attributeDbName]
                continue
            }
            // console.log(`${attribute.attribute_type}:${attributeDbName}`)
            if(!attribute.attribute_data_type.includes('[]') && Array.isArray(value)){
                errorMessages.push(`${attribute.display_name} should not be array`)
                delete productData[attributeDbName]
                continue
            }
            if(attribute.attribute_data_type.includes('[]') && !Array.isArray(value)){
                errorMessages.push(`${attribute.display_name} must be array`)
                delete productData[attributeDbName]
                continue
            }
            if(attribute.attribute_type!='richText'){
                // console.log(`${attributeDbName}: ${productData[attributeDbName]}`)
                let regexForHTML = /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/;
                // console.log(regexForHTML.test(productData[attributeDbName]))
                if(regexForHTML.test(productData[attributeDbName])){
                    errorMessages.push(`Invalid Input`)
                    delete productData[attributeDbName]
                    continue
                }
            }else{
                let scriptRegex = /<[^>]*script/
                if(scriptRegex.test(productData[attributeDbName])){
                    errorMessages.push(`Invalid Input`)
                    delete productData[attributeDbName]
                    continue
                }
            }
            if(attribute.constraint && convertReferenceValuesToId!=true){
                if(attribute.attribute_data_type.includes('[]'))
                    productData[attributeDbName] = value.map(x=>x.id)
                else
                    productData[attributeDbName] = (typeof(value)==='object')?(value.id):(value)
                continue
            }
            if(attribute.constraint && convertReferenceValuesToId===true){
                let values = Array.isArray(productData[attributeDbName])?(productData[attributeDbName]):([productData[attributeDbName]])
                try{
                    if(attribute.attribute_data_type.includes('int'))
                        values = values.map(x=>parseInt(x))
                    if(attribute.attribute_data_type.includes('float'))
                        values = values.map(x=>parseFloat(x))
                }catch(e){

                }
                values = values.map(x=>x.toString())
                // console.log(values)
                const ids = await this.commonService.getReferenceIdsFromValues(attribute, DEFAULT_LANGUAGE, metaData, values)
                const refrenceAttributeValues = ids.map(x=>x.value) 
                let difference = values.filter(x => !refrenceAttributeValues.includes(x))
                if(difference.length!=0){
                    errorMessages.push(`ReferenceValues ${difference} does not exist`)
                    continue
                }
                productData[attributeDbName] = Array.isArray(productData[attributeDbName])?(ids.map(x=>x.id)):(ids[0].id)
                continue
            }
            
            switch(attribute.attribute_data_type){
                case('boolean'):{
                    if(value===true || value===false){
                        productData[attributeDbName] = value
                    }
                    else if(value.toLowerCase()==='true' || value.toLowerCase()==='yes')
                        productData[attributeDbName] = true
                    else if(value.toLowerCase()==='false' || value.toLowerCase()==='no')
                        productData[attributeDbName] = false
                    else{
                        delete productData[attributeDbName]
                        errorMessages.push(`${attribute.display_name} must Be boolean`)
                    }
                    break
                }
                case('date'):{
                    break
                }
                case('float'):{
                    const parsedValue = parseFloat(value).toFixed(2)
                    // console.log(parsedValue)
                    if(Number.isNaN(parsedValue)){
                        delete productData[attributeDbName]
                        errorMessages.push(`${attribute.display_name} must be decimal`)
                    } 
                    if(parsedValue.toString().split('.')[0].length>attribute.length){
                        delete productData[attributeDbName]
                        errorMessages.push(`Length of ${attribute.display_name} must be less than ${attribute.length}`)
                    }

                    productData[attributeDbName] = parsedValue
                    break
                }
                case('int'):{
                    const parsedValue = parseInt(value)

                    if(Number.isNaN(parsedValue)){
                        delete productData[attributeDbName]
                        errorMessages.push(`${attribute.display_name} must be numeric`)
                    } 
                    if(parsedValue.toString().length>attribute.length){
                        delete productData[attributeDbName]
                        errorMessages.push(`Length of ${attribute.display_name} must be less than ${attribute.length}`)
                    }

                    productData[attributeDbName] = parsedValue
                    break
                }
                case('varchar'):{
                    const parsedValue = value.toString()
                    let testLengthString = ``
                    if(regexForHTML.test(parsedValue)){
                        testLengthString = await this.HTMLPartToTextPart(parsedValue)
                    }else{
                        testLengthString = parsedValue
                    }
                    if(testLengthString.length>attribute.length){
                        delete productData[attributeDbName]
                        errorMessages.push(`Length of ${attribute.display_name} must be less than ${attribute.length}`)                   
                    } 
                    break
                }
            }
        }
        return errorMessages
    }

    async HTMLPartToTextPart (HTMLPart:string) {
        return HTMLPart
                .replace(/\n/ig, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style[^>]*>/ig, '')
                .replace(/<head[^>]*>[\s\S]*?<\/head[^>]*>/ig, '')
                .replace(/<script[^>]*>[\s\S]*?<\/script[^>]*>/ig, '')
                .replace(/<\/\s*(?:p|div)>/ig, '\n')
                .replace(/<br[^>]*\/?>/ig, '\n')
                .replace(/<[^>]*>/ig, '')
                .replace('&nbsp;', ' ')
                .replace(/[^\S\r\n][^\S\r\n]+/ig, ' ')
    }
}
