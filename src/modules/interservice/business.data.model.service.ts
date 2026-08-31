import { Metadata } from '@grpc/grpc-js';
import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Client, ClientGrpc, Transport } from '@nestjs/microservices';
import { RETRY_OPTIONS, ATTRIBUTE_SERVICE, DEFAULT_ATTRIBUTES, DEFAULT_LANGUAGE, IMAGE_ATTRIBUTE_GROUP_NAME, SUCCESS, VARIANT_ATTRIBUTE_GROUP_NAME } from 'src/constants/constants';
import { MetaData, PDM } from './../../dtos/new.new.sku.dto';
import * as path from 'path';

    const y = Date.now()


    @Injectable()
    export class BusinessDataModelService {
        @Client({
            transport: Transport.GRPC,
            options: {
                channelOptions:{
                    'grpc.service_config':`{
                        "methodConfig": [{
                            "name": [{}],
                            "retryPolicy": {
                                "maxAttempts": ${RETRY_OPTIONS.maxAttempts},
                                "initialBackoff": "${RETRY_OPTIONS.initialBackoff}s",
                                "maxBackoff": "${RETRY_OPTIONS.maxBackoff}s",
                                "backoffMultiplier": ${RETRY_OPTIONS.backoffMultiplier},
                                "retryableStatusCodes": [ "UNAVAILABLE" ]
                            }
                        }]
                    }`,
                },
                package: 'BusinessDataModel',
                protoPath: path.resolve(__dirname, '../../../src/protos/attribute/rpc.proto'),
                url: `${ATTRIBUTE_SERVICE}:50051`,
                loader:{keepCase:true,defaults:true}
            }
        })
        attributeClient: ClientGrpc
        private physicalDataModelService
        private attributeService
        private attributeHierarchyService
        private referenceAttributeService

        // constructor(@Inject('ATTRIBUTE_PACKAGE') private attributeClient: ClientGrpc) {}
    
        onModuleInit() {
            this.attributeHierarchyService = this.attributeClient.getService<any>('HierarchyManagement');
            this.physicalDataModelService = this.attributeClient.getService<any>('PhysicalDataModelService');
            this.attributeService = this.attributeClient.getService<any>('AttributeService');
            this.referenceAttributeService = this.attributeClient.getService<any>('ReferenceAttributeService');
        }

        async addReferenceData(request,metaData):Promise<number>{
            try{
                console.log(request)
                const metadata = await this.addMetadata(metaData)
                const addReferenceDataObservable = await this.referenceAttributeService.AddReferenceData(request,metadata)
                const addReferenceDataResponse = await this.convertToPromise(addReferenceDataObservable)
                if(addReferenceDataResponse.status!=SUCCESS) {
                    let errorMessage:string = (addReferenceDataResponse.message===undefined)?(addReferenceDataResponse.error) : (addReferenceDataResponse.message)
                    throw new HttpException(errorMessage, 500)
                }
                return addReferenceDataResponse.data[0].rmdm_id
            }catch(e){
                console.log(`GRPC: getPhysicalDataModelv2 Error:${e.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`)
                throw new HttpException(e.message, 500)
            }
        }

        async getPDM(request,metaData){
            try{
                const metadata = await this.addMetadata(metaData)
                const getPdmResponseObservable = await this.physicalDataModelService.getPhysicalDataModel(request,metadata)
                const getPdmResponse = await this.convertToPromise(getPdmResponseObservable)
                return getPdmResponse
            }catch(e){
                console.log(`GRPC: getPhysicalDataModelv2 Error:${e.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`)
                throw new HttpException(``, 500)
            }
        }

        async getPricingDataModel(request:{id:number, lang_code:string},metaData):Promise<PDM>{
            try{
                request.id = 16916
                const metadata = await this.addMetadata(metaData)
                const getPdmResponseObservable = await this.physicalDataModelService.GetPricingDataModel(request,metadata)
                const getPdmResponse = await this.convertToPromise(getPdmResponseObservable)
                return getPdmResponse.data
            }catch(e){
                console.log(`GRPC: getPricingDataModel Error:${e.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`)
                throw new HttpException(``, 500)
            }
        }

        async camelCaseKeysToUnderscore(obj){
            if (typeof(obj) != "object") return obj;

            for(var oldName in obj){

                // Camel to underscore
                var newName = oldName.replace(/([A-Z])/g, function($1){return "_"+$1.toLowerCase();});

                // Only process if names are different
                if (newName != oldName) {
                    // Check for the old property name to avoid a ReferenceError in strict mode.
                    if (obj.hasOwnProperty(oldName)) {
                        obj[newName] = obj[oldName];
                        delete obj[oldName];
                    }
                }

                // Recursion
                if (typeof(obj[newName]) == "object") {
                    obj[newName] = await this.camelCaseKeysToUnderscore(obj[newName]);
                }
            }
            return obj;
        }

        async addMetadata(metaData:MetaData):Promise<Metadata>{
            const metadata = new Metadata()
            metadata.add('tenant_id',metaData.tenant_id)
            metadata.add('user_id',metaData.user_id)
            metadata.add('org_id',metaData.org_id)
            return metadata
        }

        //completion_percentage, thumbnail_url, input_size
        async getCategoryPDMNew(categoryId:number, metaData:MetaData):Promise<PDM>{
            try{
                const metadata = await this.addMetadata(metaData)
                const request = {id:categoryId, lang_code:'en'}
                const pdmObservable = await this.physicalDataModelService.GetPhysicalDataModel(request, metadata)
                const pdmCamelCase = await this.convertToPromise(pdmObservable)
    
                if(pdmCamelCase.status!=SUCCESS) {
                    let errorMessage:string = (pdmCamelCase.message===undefined)?(pdmCamelCase.error) : (pdmCamelCase.message)
                    throw new HttpException(`Error "GetPhysicalDataModel" GRPC: ${errorMessage}`, 500)
                }
    
                const pdm = await this.camelCaseKeysToUnderscore(pdmCamelCase)
    
                const imageAndVideosIndex = pdm.data.attribute_groups.findIndex(x=>x.attribute_group_name==='Images And Videos')
                
                if(imageAndVideosIndex===-1) 
                    pdm.data.attribute_groups.push(imagesAndVideos) 
    
                for(let [i,attributeGroup] of pdm.data.attribute_groups.entries()){
                    if(attributeGroup.attributes===undefined&&attributeGroup.attribute_group_name!='Images And Videos') pdm.data.attribute_groups.splice(i,1)
                    if(attributeGroup.attributes===undefined||attributeGroup.attributes===null||attributeGroup.attributes.length===0) continue
                    for (let attribute of attributeGroup.attributes) {
                        const VARIANT_DEFAULT = DEFAULT_ATTRIBUTES.map(x=>`${x}_variants`)
                        if(attributeGroup.attribute_group_name===VARIANT_ATTRIBUTE_GROUP_NAME){
                            const index = VARIANT_DEFAULT.findIndex(x=>x===attribute.attribute_db_name)
                            if(index!=-1){
                                attribute.attribute_db_name = DEFAULT_ATTRIBUTES[index]
                            }
                        }
                        attribute['input_size'] = 6
                        if(attribute.attribute_type==='dropdown' || attribute.attribute_type==='multiSelect' || attribute.attribute_type==='singleSelect') {   
                            attribute['refrence_values'] = [{id:1, value:'Default'}]
                            attribute['old_reference_values'] = [{id:1, value:'Default'}]
                        }
                        if(attribute.auto_translate===undefined || attribute.auto_translate===null)
                            attribute.auto_translate = true
                        if(attribute.target_rule_only === true){
                        if(!(attribute.attribute_value ==null  || attribute.attribute_value ==undefined)){
                                if(Array.isArray(attribute.attribute_value)){
                                    if(attribute.attribute_value.length === 0){
                                        attribute['attr_block'] = true;
                                    }
                                } else {
                                    attribute['attr_block'] = true;
                                }
                            }
                        }
                    }
                }
                return pdm.data
            }catch(e){
                console.log(`GRPC: getPhysicalDataModel Error:${e.message} || Request: ${JSON.stringify({id:categoryId, lang_code:'en'})} || Metadata:${JSON.stringify(metaData)}`)
                throw new HttpException(``, 500)
            }
            
        }

        async updatePhysicalDataModel(categoryId:number, metaData:MetaData){
            try{
                const metadata = await this.addMetadata(metaData)
                const request = {id:categoryId, lang_code:'en'}
                const updatePdmObservable = await this.physicalDataModelService.UpdatePhysicalDataModel(request, metadata)
                await this.convertToPromise(updatePdmObservable)
            }catch(e){
                console.log(`GRPC: updatePhysicalDataModel Error:${e.message} || Request: ${JSON.stringify({categoryId})} || Metadata:${JSON.stringify(metaData)}`)
                throw new HttpException(``, 500)
            }
        }

        async convertToPromise(v){
            //To Convert Observable to Promise
            return v.toPromise()
        }
    }

    const imagesAndVideos = {
        "id": -5,
        "attribute_group_name": IMAGE_ATTRIBUTE_GROUP_NAME,
        "status": true,
        "created_at": "Mon Feb 06 2023 08:28:48 GMT+0000 (Coordinated Universal Time)",
        "updated_at": "Mon Feb 06 2023 08:28:48 GMT+0000 (Coordinated Universal Time)",
        "created_by": "auth0|63c5462fb4b6a8f1c1db9ca6",
        "updated_by": "auth0|63c5462fb4b6a8f1c1db9ca6"
    }




