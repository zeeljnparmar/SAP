import { HttpException, Inject } from "@nestjs/common"
import { InjectDataSource } from "@nestjs/typeorm"
import Redis from "ioredis"
import { Attribute, ChannelData, LocationData, MetaData, ReferenceValue } from "src/dtos/new.new.sku.dto"
import { PriceUomCalculationMetadata, ProductData, ProductMetadata, ProductPrice, SAPMapping, UomConversionMetrics } from "src/entities/fixed.tables.entity"
import { BusinessDataModelService } from "src/modules/interservice/business.data.model.service"
import { WorkflowService } from "src/modules/interservice/workflow.service"
import { DataSource, EntityManager, In } from "typeorm"
import * as fs from 'fs'
import { BusinessRuleService } from "../interservice/bussinessrule.service"
import { DEFAULT_LANGUAGE, PRICE_ATTRIBUTES_IN_PRODUCT, PRICING_INFO_ATTRIBUTE_GROUP_NAME } from "src/constants/constants"
import { v4 as uuidv4 } from 'uuid';
import { ValidationService } from "../validations/validations.service"

export class PimUploadService {

    constructor(
        // private readonly skuService:SkuService,
        private readonly businessDataModelService:BusinessDataModelService,
        // private readonly commonService:CommonService,
        private readonly workflowService:WorkflowService,
        @Inject('REDIS_CLIENT') private readonly clientRedis: Redis,
        @InjectDataSource('pdm') private pdmDataSource:DataSource,
        @InjectDataSource('pdmReader') private pdmReaderDataSource:DataSource,
        private readonly businessRuleService:BusinessRuleService,
        private readonly validationService:ValidationService
    ){}

    async getLangCodeAppendToTable(langCode: string) {
        if (langCode === 'en' || langCode === '') return ''
        else if (langCode[0] === '_') return langCode
        else return '_' + langCode
    }

    async getReferenceValues(body: {reference_attribute_id:number, reference_master_id:number}, languageCode: string, metaData: MetaData, rmIds?: any[]): Promise<ReferenceValue[]> {
        const langCode = await this.getLangCodeAppendToTable(languageCode)
        // const referenceMasterTable = await this.getReferenceMasterTableName(body.reference_master_id, metaData)
        // const [{attribute_db_name}] = await this.pdmDataSource.manager.query(`SELECT attribute_db_name FROM reference_attributes WHERE id = $1 AND tenant_id = $2 AND org_id = $3`,[body.reference_attribute_id, metaData.tenant_id, metaData.org_id])

        let rmIdWhereCondition = ``
        if (rmIds != undefined && !rmIds.includes(undefined)) {
            for (let [i, rmId] of rmIds.entries()) {
                if (rmId === undefined)
                    continue
                if (rmId.toString().includes('[') && rmId.toString().includes(']'))
                    rmIds[i] = JSON.parse(rmId)
            }
            rmIds = rmIds.flatMap(x => x)

            rmIdWhereCondition = `AND rmdm_id IN (${rmIds})`
        }

        // if(rmIds!=undefined)
        //     rmIdWhereCondition = `AND rm_id IN (${rmIds})`
        const referenceValues = await this.pdmDataSource.manager.query(
            `SELECT rmdm_id AS id, value, status 
            FROM reference_master_data${langCode} 
            WHERE ra_id=$1
            AND rm_id=$2
            AND tenant_id=$3
            AND org_id=$4
            AND deleted_at isNull ${rmIdWhereCondition} 
            and value is not null
            --AND status = true`
            , [body.reference_attribute_id, body.reference_master_id, metaData.tenant_id, metaData.org_id])
        // if(!body.attribute_data_type.includes('[]'))
        // const referenceValues = await this.pdmDataSource.manager.query(`SELECT rm_id AS id, "${attribute_db_name}" AS value FROM ${referenceMasterTable+langCode} WHERE status = true AND deleted_at isNull ${rmIdWhereCondition}`)
        return referenceValues
    }

    async sapTriggerStoreStatus(metaData){
        const readerQueryRunner = this.pdmDataSource.createQueryRunner()
        const mappings = await readerQueryRunner.query(`SELECT * FROM sap_mapping`)
        const configuredStoreCodes = mappings.filter(x=>x.type==='store_codes').map(x=>x.pim_attribute)
        //^Price
        const pricingChannels = await this.getPricingChannels(metaData)
        const pricingLocations = await this.getPricingLocations(metaData)
        let statusBatchSize = 1000
        let i = 0
        for(let status of [true, false]){
            let batchData = []
            const priceStoreStatusDataCursor = await readerQueryRunner.stream(`
                WITH sap_store_status_filtered AS (
                    SELECT *
                    FROM public.sap_store_status
                    WHERE processing_status = 'pending'
                    AND status = $4
                    AND store_code = ANY($3)
                ),
                dpa AS (
                    SELECT
                        pdm_id,
                        article_no,
                        category_id,
                        code
                    FROM public.default_product_attributes
                    WHERE tenant_id = $1
                    AND org_id = $2
                    AND code IS NOT NULL
                    AND product_name IS NOT NULL
                ),
                pm AS (
                    SELECT
                        pdm_id,
                        classification,
                        category_id,
                        parent_pdm_id
                    FROM public.product_metadata
                    WHERE tenant_id = $1
                    AND org_id = $2
                ),
                pp AS (
                    SELECT DISTINCT
                        pdm_id,
                        category_id
                    FROM public.product_price
                    WHERE tenant_id = $1
                    AND org_id = $2
                ),
                dpapm AS (
                    SELECT
                        pm.classification,
                        pm.parent_pdm_id,
                        pm.pdm_id,
                        pm.category_id,
                        dpa.code,
                        COALESCE(parent_dpa.article_no, dpa.article_no) AS article_no
                    FROM pm
                    INNER JOIN dpa
                        ON pm.pdm_id = dpa.pdm_id
                    AND pm.category_id = dpa.category_id
                    LEFT JOIN dpa parent_dpa
                        ON parent_dpa.pdm_id = pm.parent_pdm_id
                    LEFT JOIN pp
                        ON pm.pdm_id = pp.pdm_id
                    AND pm.category_id = pp.category_id
                )
                SELECT
                    sss.*,
                    dpapm.*
                FROM sap_store_status_filtered sss
                INNER JOIN dpapm
                    ON dpapm.article_no = sss."Article_Number"
                LEFT JOIN public.static_store_status_starquik st
                    ON st.store_code = sss.store_code
                AND st.code = dpapm.code
                WHERE st.store_code IS NULL;
    
                `, [metaData.tenant_id, metaData.org_id, configuredStoreCodes, status])
            for await(const doc of priceStoreStatusDataCursor){
                i++
                // console.log(`${i}----${doc.Article_Number}---${doc.store_code}---${status}----`)
                const storeCode = doc.store_code
                const locationId = pricingLocations.find(x=>x.location_id===storeCode)?.id
                const pdmId = doc.pdm_id
                const categoryId = doc.category_id
                const classification = doc.classification
                for(let channel of pricingChannels){
                    // let isStyle = false
                    // if(classification==='Style') isStyle = true
                    batchData.push({
                        location_id:locationId,
                        article_no:doc.Article_Number,
                        store_code:doc.store_code,
                        pdm_id:pdmId,
                        category_id:categoryId,
                        channel_id:channel.id
                    })
                }
                if(batchData.length > statusBatchSize){
                    // console.log(`Inserting Batch`)
                    await this.updateStoreStatusBatch(batchData, status, metaData)
                    batchData = []
                }                
    
            }
            if(batchData.length > 0){
                // console.log(`Inserting Remaining Batch`)
                await this.updateStoreStatusBatch(batchData, status, metaData)
                batchData = []
            } 
        }
        await readerQueryRunner.release()
    }

    async updateStoreStatusBatch(batchData, status, metaData){
        const whereCondition = batchData.map(x=>`(${x.location_id}, ${x.channel_id}, ${x.pdm_id}, ${x.category_id}, $1, $2, $3, $4, $5, $6)`)    
    
        await this.pdmDataSource.query(`
            INSERT INTO product_price (location_id, channel_id, pdm_id, category_id, tenant_id, org_id, price, user_action_id, user_id, updated_at)
            VALUES ${whereCondition}
            ON CONFLICT (location_id, channel_id, pdm_id, category_id, tenant_id, org_id)
            DO UPDATE SET price = product_price.price || EXCLUDED.price, user_action_id = EXCLUDED.user_action_id, user_id = EXCLUDED.user_id, updated_at = EXCLUDED.updated_at
        `, [metaData.tenant_id, metaData.org_id, {status:status}, uuidv4(), metaData.user_id, new Date(Date.now()).toISOString()])
    
        await this.pdmDataSource.manager.query(`
            UPDATE sap_store_status SET processing_status = 'done'
                WHERE ("Article_Number", "store_code", "status") IN
                (${batchData.map(x=>`('${x.article_no}','${x.store_code}', ${status})`)})    
        `) 
    }

    async getPricingChannels(metaData:MetaData){
        const channelData:ChannelData[] =  await this.pdmReaderDataSource.manager.query(`SELECT user_channel.channel_id as id, subscribed_channels.channel_name as channel_name from user_channel INNER JOIN subscribed_channels ON
                    user_channel.channel_id = subscribed_channels.channel_id AND
                    user_channel.user_id = $3 AND
                    user_channel.tenant_id = $1 AND
                    user_channel.module = 'pricing' AND
                    subscribed_channels.org_id = $2 AND
                    user_channel.tenant_id = $1 AND
                    subscribed_channels.org_id = $2
            `, [metaData.tenant_id, metaData.org_id, metaData.user_id])
        return channelData
    }

    async getPricingLocations(metaData:MetaData){
        const reference_master_id = (await this.pdmReaderDataSource.manager.query(`SELECT id AS reference_master_id FROM reference_masters WHERE tenant_id = $1 AND org_id = $2 AND master_entity_type = $3 `, [metaData.tenant_id, metaData.org_id, 'location_master']))[0]?.reference_master_id
        if(reference_master_id===undefined)
            throw new HttpException(`Location Master Does exist for this Tenant`, 401)

        const locationData:LocationData[] = (await this.pdmReaderDataSource.manager.query(`
            WITH reference_master_data_entity AS (
                    SELECT rmdm_id FROM reference_master_data where rm_id = $3 and tenant_id = $1 AND org_id = $2 GROUP BY rmdm_id
                )
                SELECT
                reference_master_data_entity.rmdm_id AS id
                , (SELECT value
                    FROM reference_master_data
                    WHERE reference_master_data.rmdm_id = reference_master_data_entity.rmdm_id
                    AND ra_id IN (SELECT id AS ra_id FROM reference_attributes WHERE tenant_id = $1 AND org_id = $2 AND attribute_name = $4 AND reference_master_id = $3)
                    AND tenant_id = $1 
                    AND org_id = $2 
                    AND rm_id = $3
                ) as location_name,
                 (SELECT value
                    FROM reference_master_data
                    WHERE reference_master_data.rmdm_id = reference_master_data_entity.rmdm_id
                    AND ra_id IN (SELECT id AS ra_id FROM reference_attributes WHERE tenant_id = $1 AND org_id = $2 AND attribute_name = $5 AND reference_master_id = $3)
                    AND tenant_id = $1 
                    AND org_id = $2 
                    AND rm_id = $3
                ) as location_id
                FROM reference_master_data_entity
            `, [metaData.tenant_id, metaData.org_id, reference_master_id, 'location_name', 'location_id'])).filter(x=>x?.location_name!=null)
        return locationData
    }

    async markSapPricesProcessed(batchData:any[]){
        const updatedCount = await this.pdmDataSource.manager.query(`
            UPDATE sap_prices SET processing_status = 'done'
                WHERE ("Article_Number", "store_code") IN
                (${batchData.map(x=>`('${x.article_no}','${x.store_code}')`)})    
        `)
        console.log(updatedCount)
        // const seen = new Set()
        // const rows = []
        // for(const x of batchData){
        //     const key = `${x.article_no}|${x.store_code}`
        //     if(seen.has(key)) continue
        //     seen.add(key)
        //     const mrp = (x.sap_mrp===null || x.sap_mrp===undefined) ? 'NULL::numeric' : `${x.sap_mrp}::numeric`
        //     const map = (x.sap_map===null || x.sap_map===undefined) ? 'NULL::numeric' : `${x.sap_map}::numeric`
        //     rows.push(`('${x.article_no}','${x.store_code}',${mrp},${map})`)
        // }
        // if(rows.length===0) return
        // await this.pdmDataSource.manager.query(`
        //     UPDATE sap_prices sp SET processing_status = 'done'
        //     FROM (VALUES ${rows.join(',')}) AS v(article_no, store_code, mrp, map)
        //     WHERE sp."Article_Number" = v.article_no
        //         AND sp.store_code = v.store_code
        //         AND sp."MRP" IS NOT DISTINCT FROM v.mrp
        //         AND sp."MAP" IS NOT DISTINCT FROM v.map
        // `)
    }

    async insertPriceBatch(batchData, metaData:MetaData, updateTime?:string){
        if(updateTime===undefined) updateTime = new Date(Date.now()).toISOString()
        if(batchData.length===0)
            return
        const values:string[] = []
        const priceDatas = await this.generateBusinessRulesRequest(batchData, metaData, this.pdmDataSource.createEntityManager())
        for(let priceData of priceDatas){
            values.push(`(${priceData.location_id}, ${priceData.channel_id}, ${priceData.pdm_id}, ${priceData.category_id}, $1, $2, '${JSON.stringify(priceData.price_data)}', $3, $4, $5)`)
        }
        //^
        await this.pdmDataSource.createEntityManager().query(`
            INSERT INTO product_price (location_id, channel_id, pdm_id, category_id, tenant_id, org_id, price, user_action_id, user_id, updated_at)
            VALUES ${values}
            ON CONFLICT (location_id, channel_id, pdm_id, category_id, tenant_id, org_id)
            DO UPDATE SET price = product_price.price || EXCLUDED.price, user_action_id = EXCLUDED.user_action_id, user_id = EXCLUDED.user_id, updated_at = EXCLUDED.updated_at
        `, [metaData.tenant_id, metaData.org_id, uuidv4(), metaData.user_id, updateTime])
    }

    async sapTriggerPrice(metaData:MetaData, updateTime?:string, jobId?:number){
        console.log(`JOB ID:${jobId}, Price Insertion Started`)
        let i = 0
        const readerQueryRunner = this.pdmDataSource.createQueryRunner()
        await readerQueryRunner.connect()
        try{
            const mappings:SAPMapping[] = await readerQueryRunner.query(`SELECT * FROM sap_mapping`)
            // console.log(`JOB ID:${jobId}, Got SAP Mappings`)
            const configuredStoreCodes = mappings.filter(x=>x.type==='store_codes').map(x=>x.pim_attribute)
            // console.log(`JOB ID:${jobId}, Filter Mappings`)
            //^Price
            const priceMappings = mappings.filter(x=>x.type==='price')
            // console.log(`JOB ID:${jobId}, Price Mappings`)
            const pricingChannels = await this.getPricingChannels(metaData)
    
            const pricingLocations = await this.getPricingLocations(metaData)
            // return data
            const priceDataCursor = await readerQueryRunner.stream(`
                with sap_prices as (
                    select * from sap_prices 
                        where store_code = ANY($3) 
                        and processing_status IN ('pending')
                ),
                dfp as (
                    select pdm_id, article_no, category_id from default_product_attributes 
                        where tenant_id = $1
                        and org_id = $2 
                        and code is not null 
                        and product_name is not null
                ),
                pm as (
                    select pdm_id, classification, category_id from product_metadata 
                        where tenant_id = $1
                        and org_id = $2 
                )
                select * from sap_prices 
                    inner join dfp on 
                    dfp.article_no = sap_prices."Article_Number" 
                    inner join pm on
                    dfp.pdm_id = pm.pdm_id and
                    dfp.category_id = pm.category_id
                    --WHERE "Article_Number" = '000000000001352822' and store_code = 'ST04'
            `, [metaData.tenant_id, metaData.org_id, configuredStoreCodes])
    
            let batchSize = parseInt(mappings.find(x=>x.type==='price_batch_size').pim_attribute)
            let batch = 0
            let batchData = []
            const fakeUpdateBatchSize = 1000
            let fakeUpdateBatchData = []
            let stylePdmCategoryIds = []
            i = 0
            const priceAttributes = await this.pdmDataSource.manager.query(`
                SELECT * FROM attributes 
                    WHERE attribute_db_name = ANY($1)
                    AND tenant_id = $2 
                    AND org_id = $3  
            `, [priceMappings.map(x=>x.pim_attribute), metaData.tenant_id, metaData.org_id])
            // console.log(`JOB ID:${jobId}, Got all price attributes`)
            let j = 0
            for await(const doc of priceDataCursor){
                let errors = []
                i++
                // let fakeUpdateBatchData = []
                
                const articleNo = doc.Article_Number
                const storeCode = doc.store_code
                const locationId = pricingLocations.find(x=>x.location_id===storeCode)?.id
                const primas = doc.PRIMAS_file
                const invmas = doc.INVMAS_file
                
                if(locationId===undefined){
                    await this.pdmDataSource.manager.query(`
                        UPDATE sap_prices SET processing_status = 'error'
                            WHERE "Article_Number" = '${articleNo}' 
                            AND store_code = '${storeCode}'    
                    `)
                    // if(primas)
                    let primasFilter = primas===null ? `` : `('${articleNo}','${storeCode}', '${primas}'),`
                    let invmasFilter = invmas===null ? `` : `('${articleNo}','${storeCode}', '${invmas}')`
                    if(invmasFilter!=`` || primasFilter!=``)
                        await this.pdmDataSource.manager.query(`
                            UPDATE sap_file_history SET status = 'error', last_modified_pim = '${new Date(Date.now()).toISOString()}', error = 'Location ${storeCode} does not exist'
                                WHERE ("Article_Number", "store_code", "filename") IN
                                (
                                    ${primasFilter} 
                                    ${invmasFilter}
                                )   
                        `)
                    continue
                }
                let timeStr = ``
                let a = Date.now()
                let pdmId = doc.pdm_id
                let categoryId = doc.category_id
    
                let priceData = {}
                for(let priceMapping of priceMappings){
                    if(doc[priceMapping.sap_attribute]===null || doc[priceMapping.sap_attribute]===undefined) 
                        continue
                    priceData[priceMapping.pim_attribute] = doc[priceMapping.sap_attribute]
                }
                
                await this.validationService.productDataValidation(priceData, 0, metaData, priceAttributes)
                priceData['use_case']='Price change from SAP'
                const classification = doc.classification
    
                //!Temp Code \/
                if(classification==='Normal'){
                    if(String(priceData['promotion_enabled']) != '5140'){
                        priceData['offer_margin_mechanism'] = 5123
                        priceData['offer_margin_value'] = 3
                    }
                    
                }
                // console.log(priceData)
                //!Temp Code ^
                if(classification==='Style'){
                    for(let channel of pricingChannels){
                        stylePdmCategoryIds.push({pdm_id:pdmId, category_id:categoryId, location_id:locationId, channel_id:channel.id})
                    }
                }
                for(let channel of pricingChannels){
                    batchData.push({
                        article_no:articleNo,
                        store_code:doc.store_code,
                        primas:doc.PRIMAS_file,
                        invmas:doc.INVMAS_file,
                        location_id:locationId,
                        pdm_id:pdmId,
                        category_id:categoryId,
                        price_data:priceData,
                        channel_id:channel.id,
                        // Raw sap_prices values read from the cursor snapshot. Used for compare-and-set
                        // when marking 'done' so a value that changed mid-run is not blindly stamped processed.
                        sap_mrp:doc.MRP,
                        sap_map:doc.MAP,
                        ...priceData
                    })
                    batch++
                }
                // timeStr += `Developing Batch ${Date.now()-a}ms || `
                a = Date.now()
                if(batchData.length>batchSize){
                    a = Date.now()
                    batch = 0
    
                    console.log(`JOB ID:${jobId}, Inserting Price Batch ${j} Started`)
                    await this.insertPriceBatch(batchData, metaData)
                    console.log(`JOB ID:${jobId}, Inserting Price Batch ${j} Ended`)
                    j++
    
                    if(stylePdmCategoryIds.length!=0){
                        console.log(`JOB ID:${jobId}, UOM Calculation Price Batch ${j} Started`)
                        for(let stylePdmCategoryId of stylePdmCategoryIds){
                            //^
                            await this.parentPriceChanged(stylePdmCategoryId.pdm_id, stylePdmCategoryId.category_id, metaData, this.pdmDataSource.createEntityManager(), stylePdmCategoryId.location_id, stylePdmCategoryId.channel_id, updateTime)
                        }
                        console.log(`JOB ID:${jobId}, UOM Calculation Price Batch ${j} Ended`)
                    }
                    //^
                    await this.markSapPricesProcessed(batchData)
                    const primasBatchData = batchData.filter(x=>x.primas!=null)
                    const primasCount = primasBatchData.reduce((acc, { primas }) => {
                        acc[primas] = (acc[primas] || 0) + 1;
                        return acc;
                    }, {});
    
                    const invmasBatchData = batchData.filter(x=>x.invmas!=null)
                    const invmasCount = invmasBatchData.reduce((acc, { invmas }) => {
                        acc[invmas] = (acc[invmas] || 0) + 1;
                        return acc;
                    }, {});
                    const totalCount = {...primasCount, ...invmasCount}
    
                    const fileNameKeys = Object.keys(totalCount)
                    const fileNameValues = Object.values(totalCount)
                    //^
                    if(fileNameKeys.length!=0)
                        await this.pdmDataSource.manager.query(`
                        UPDATE sap_price_files_history
                            SET
                                total_articles_updated = sap_price_files_history.total_articles_updated + data_to_update.count_to_add
                            FROM (
                                SELECT
                                    unnest($1::text[]) AS filename,
                                    unnest($2::integer[]) AS count_to_add
                                ) AS data_to_update
                            WHERE
                                sap_price_files_history.filename = data_to_update.filename;    
                        `, [fileNameKeys, fileNameValues])
                    a = Date.now()
                    // console.log(`here before file history update`)
                    // if(invmasFilter!=`` || primasFilter!=``)
                    //     await this.pdmDataSource.manager.query(`
                    //         UPDATE sap_file_history SET status = 'done', last_modified_pim = '${new Date(Date.now()).toISOString()}'
                    //             WHERE ("Article_Number", "store_code", "filename") IN
                    //             (
                    //                 ${primasFilter} ${invmasFilter}
                    //             )   
                    //     `)
                    // console.log(`File history: ${Date.now()-a}ms`)
                    // const mongoObjectIds = batchData.map(x=>x._id)
                    // await this.productPushMongoConnection.db.collection('sftp_product_price_data').updateMany({_id:{$in:mongoObjectIds}},{$set:{
                    //     processing_status:2
                    // }})
                    batchData = []
                    stylePdmCategoryIds = []
                    timeStr += `Inserting Batch ${Date.now()-a}ms || `
                }
                // }
                // console.log(`${i}--${doc.Article_Number}----${doc.store_code}-----${timeStr}`)
            }
            // console.log(JSON.stringify(batchData))
            //^
            if(batchData.length>0){
                // console.log(`here123`)
                const primasBatchData = batchData.filter(x=>x.primas!=null)
                let primasFilter = primasBatchData.length==0 ? `` : `${primasBatchData.map(x=>`('${x.article_no}','${x.store_code}', '${x.primas}')`)},`
                
                const invmasBatchData = batchData.filter(x=>x.invmas!=null)
                let invmasFilter = invmasBatchData.length==0 ? `` : `${invmasBatchData.map(x=>`('${x.article_no}','${x.store_code}', '${x.invmas}')`)}`
    
                console.log(`JOB ID:${jobId}, Inserting Last Price Batch ${j} Started`)
                await this.insertPriceBatch(batchData, metaData)
                console.log(`JOB ID:${jobId}, Inserting Last Price Batch ${j} Ended`)
                j++
    
                await this.markSapPricesProcessed(batchData)
                const a = Date.now()
                // console.log(`here before file history update`)
                if(invmasFilter!=`` || primasFilter!=``)
                    await this.pdmDataSource.manager.query(`
                        UPDATE sap_file_history SET status = 'done'
                            WHERE ("Article_Number", "store_code", "filename") IN
                            (
                                ${primasFilter} ${invmasFilter}
                            )   
                    `)
            }
            if(stylePdmCategoryIds.length!=0){
                console.log(`JOB ID:${jobId}, UOM Calculation Price Batch ${j} Started`)
                for(let stylePdmCategoryId of stylePdmCategoryIds){
                    await this.parentPriceChanged(stylePdmCategoryId.pdm_id, stylePdmCategoryId.category_id, metaData, this.pdmDataSource.createEntityManager(), stylePdmCategoryId.location_id, stylePdmCategoryId.channel_id)
                }
                console.log(`JOB ID:${jobId}, UOM Calculation Price Batch ${j} Ended`)
            }
        }finally{
            await readerQueryRunner.release()
        }
        return {}//this.skuService.responseObject(SUCCESS, `Success`, {})
    }

    async parentPriceChanged(parentPdmId:number, categoryId:number, metaData:MetaData, entityManager:EntityManager, locationId?:number, channelId?:number, updateTime?:string){
        const variants = await entityManager.getRepository(ProductMetadata).find({
            where:{
                tenant_id:metaData.tenant_id,
                org_id:metaData.org_id,
                parent_pdm_id:parentPdmId,
                category_id:categoryId
            },
            select:{
                pdm_id:true
            }
        })
        if(variants.length===0)
            return
        const variantPdmIds = variants.map(x=>x?.pdm_id)
        await this.calculateVariantPrice(variantPdmIds, categoryId, metaData, entityManager, locationId, channelId, updateTime)
    }

    async calculateVariantPrice(variantPdmIds:number[], categoryId:number, metaData:MetaData, entityManager:EntityManager, locationId?:number, channelId?:number, updateTime?:string){
        if(updateTime===undefined) updateTime = new Date(Date.now()).toISOString()
        if(variantPdmIds.length===0)
            return
        const response = await entityManager.getRepository(ProductMetadata).findOne({
            where:{
                pdm_id:variantPdmIds[0],
                category_id:categoryId,
                tenant_id:metaData.tenant_id,
                org_id:metaData.org_id
            },
            select:{
                parent_pdm_id:true
            }
        })
        const parent_pdm_id = response?.parent_pdm_id
        const parentProductPrice = await entityManager.getRepository(ProductPrice).find({
            where:{
                pdm_id:parent_pdm_id,
                category_id:categoryId,
                tenant_id:metaData.tenant_id,
                org_id:metaData.org_id,
                location_id:locationId,
                channel_id:channelId
            }
        })
        if(parentProductPrice.length===0)
            return
        const priceUomCalculationMetadata = await entityManager.getRepository(PriceUomCalculationMetadata).findOne({
            where:{
                tenant_id:metaData.tenant_id,
                org_id:metaData.org_id
            }
        })
        if(priceUomCalculationMetadata===null)
            return
        const uomConversionMetrics = await entityManager.getRepository(UomConversionMetrics).find({})
        if(uomConversionMetrics===null)
            return

        const productDatas = await entityManager.getRepository(ProductData).find({
            where:[
                {
                    category_id:categoryId,
                    tenant_id:metaData.tenant_id,
                    org_id:metaData.org_id,
                    pdm_id:In([...variantPdmIds, parent_pdm_id])
                }
            ]
        })
        const attributes = await entityManager.query(`SELECT * FROM attributes where attribute_db_name = any($1) and tenant_id = $2 and org_id = $3`, [[priceUomCalculationMetadata.uom_attribute, priceUomCalculationMetadata.variant_attribute], metaData.tenant_id, metaData.org_id])

        const uomAttribute = attributes.find(x=>x.attribute_db_name===priceUomCalculationMetadata.uom_attribute)
        const variantAttribute = attributes.find(x=>x.attribute_db_name===priceUomCalculationMetadata.variant_attribute)
        if(!variantAttribute.constraint)
            return
        if(uomAttribute.attribute_data_type.includes('[]'))
            return

        const parentProductData = productDatas.find(x=>x.pdm_id===parent_pdm_id)
        const uomReferenceValues = await this.getReferenceValues(uomAttribute, DEFAULT_LANGUAGE, metaData)
        const measureReferenceValues = await this.getReferenceValues(variantAttribute, DEFAULT_LANGUAGE, metaData)
        let businessRuleProducts = []
        for(let pdmId of variantPdmIds){
            const productData = productDatas.find(x=>x.pdm_id==pdmId)
            if(productData===undefined) continue
            if(parentProductData===undefined) continue
            const priceMultiplierValue = await this.calculatePriceMuliplier(productData, parentProductData, uomAttribute,priceUomCalculationMetadata, uomReferenceValues, variantAttribute, measureReferenceValues, uomConversionMetrics)
            if(priceMultiplierValue===null)
                    continue
            const businessRuleProductsValue = await this.calculatePrice(pdmId, categoryId, parentProductPrice, priceUomCalculationMetadata, priceMultiplierValue)
            businessRuleProducts = businessRuleProducts.concat(businessRuleProductsValue)
        }
        let values:string[] = []
        let userActionId = uuidv4()
        if(businessRuleProducts.length!=0){
            const priceDatas = await this.generateBusinessRulesRequest(businessRuleProducts, metaData, entityManager)
            for(let priceData of priceDatas){
                values.push(`(${priceData.location_id}, ${priceData.channel_id}, ${priceData.pdm_id}, ${priceData.category_id}, $1, $2, '${JSON.stringify(priceData.price_data)}', $3, $4, $5, $6)`)
            }
            await this.pdmDataSource.query(`
                INSERT INTO product_price (location_id, channel_id, pdm_id, category_id, tenant_id, org_id, price, user_action_id, user_id, updated_at, source)
                VALUES ${values}
                ON CONFLICT (location_id, channel_id, pdm_id, category_id, tenant_id, org_id)
                DO UPDATE SET price = product_price.price || EXCLUDED.price, user_action_id = EXCLUDED.user_action_id, user_id = EXCLUDED.user_id, updated_at = EXCLUDED.updated_at
            `, [metaData.tenant_id, metaData.org_id, userActionId, metaData.user_id, updateTime, 'uom_auto_calculation'])
        } 
    }

    async calculatePrice(pdmId:number, categoryId:number, parentProductPrices:ProductPrice[], priceUomCalculationMetaData: PriceUomCalculationMetadata, priceMultiplierValue:number ){
        const businessRuleProducts:any = []
        if(parentProductPrices.length===0)
            return []
        for(let parentProductPrice of parentProductPrices){
            const priceUpdateObject = {}
            for(let priceAttribute of priceUomCalculationMetaData.price_attributes){
                if(parentProductPrice.price?.[priceAttribute]===undefined || parentProductPrice.price?.[priceAttribute]===null)
                    continue
                priceUpdateObject[priceAttribute] =  !isNaN(parentProductPrice.price?.[priceAttribute]) ? parentProductPrice.price?.[priceAttribute] * priceMultiplierValue : parentProductPrice.price?.[priceAttribute]
            }
            for(let priceAttribute of priceUomCalculationMetaData.copy_attributes){
                if(parentProductPrice.price?.[priceAttribute]===undefined || parentProductPrice.price?.[priceAttribute]===null)
                    continue
                priceUpdateObject[priceAttribute] = parentProductPrice.price?.[priceAttribute]
            }
            if(Object.keys(priceUpdateObject).length!=0){
                businessRuleProducts.push({
                    location_id:parentProductPrice.location_id,
                    pdm_id:pdmId,
                    category_id:categoryId,
                    price_data:priceUpdateObject,
                    channel_id:parentProductPrice.channel_id,
                    ...priceUpdateObject
                })
            }
        }
        return businessRuleProducts
    }

    async calculatePriceMuliplier(productData: ProductData, parentProductData:ProductData, uomAttribute:Attribute, priceUomCalculationMetaData:PriceUomCalculationMetadata, uomReferenceValues:ReferenceValue[], variantAttribute:Attribute, measureReferenceValues:ReferenceValue[], uomConversionMetrics:UomConversionMetrics[]){
        // const productData = productDatas.find(x=>x.pdm_id==pdmId)
        let uomValue:string = productData.product_data[uomAttribute.attribute_db_name] ?? parentProductData.product_data[uomAttribute.attribute_db_name] ?? null
        let measureValueId = productData.product_data[priceUomCalculationMetaData.variant_attribute] ?? null
        if(uomValue===null || measureValueId===null)
            return null
        // uomValue = uomValue.toLowerCase()
        if(uomAttribute.constraint===true)
            uomValue = uomReferenceValues.find(x=>x.id.toString()===uomValue.toString())?.value
        if(uomValue===null)
            return null
        uomValue = uomValue.toLowerCase()
        measureValueId = variantAttribute.attribute_data_type.includes('[]') ? (measureValueId[0]) : (measureValueId)

        let measureValue = measureReferenceValues.find(x=>x.id.toString()===measureValueId.toString())?.value
        if(measureValue===undefined)
            return null
        if(measureValue===null)
            return null
        if(isNaN(measureValue))
            return null
        let measureValueFloat = parseFloat(measureValue)

        const uomConversionMetric = uomConversionMetrics.find(x=>x.values.includes(uomValue))
        if(uomConversionMetric===undefined)
            return null
        const priceMultiplierValue:number = parseFloat((measureValueFloat/uomConversionMetric.conversion_multiplier).toFixed(2))
        return priceMultiplierValue
    }

        getColumnMetaData(pricingDataAttributes: Attribute[]){
        const pricingColumnMetadata = pricingDataAttributes.map(x=>{
            return {
                ...x,
                key:x.attribute_db_name,
                "price_attribute":true
            }
        })
        return [
            {
                "key": "location_name",
                "attribute_db_name": "location_name",
                "display_name": "Location",
                "price_attribute":false
            },
            {
                "key": "code",
                "attribute_db_name": "code",
                "display_name": "SKU Code",
                "price_attribute":false
            },
            {
                "key": "classification",
                "attribute_db_name": "classification",
                "display_name": "Classification",
                "price_attribute":false
            },
            {
                "key": "thumbnail",
                "attribute_db_name": "thumbnail",
                "display_name": "Image",
                "price_attribute":false
            },
            {
                "key": "product_name",
                "attribute_db_name": "product_name",
                "display_name": "Product Name",
                "price_attribute":false
            },
            ...pricingColumnMetadata,
            {
                "key": "listing_status",
                "attribute_db_name": "listing_status",
                "display_name": "Product Listing Status",
                "price_attribute":false
            },
            {
                "key": "price_push_status",
                "attribute_db_name": "price_push_status",
                "display_name": "Price Listing Status",
                "price_attribute":false
            },
            {
                "key": "created",
                "attribute_db_name": "created",
                "display_name": "Created",
                "price_attribute":false
            },
            {
                "key": "last_updated",
                "attribute_db_name": "last_updated",
                "display_name": "Last Modified",
                "price_attribute":false
            },
            {
                "key": "status",
                "attribute_db_name": "status",
                "display_name": "Status",
                "price_attribute":false
            },
            {
                "key": "static_mrp",
                "attribute_db_name": "static_mrp",
                "display_name": "Static MRP",
                "price_attribute":false
            }
        ]

    }

    async generateBusinessRulesRequest(priceData:{location_id:number, pdm_id:number, category_id:number, channel_id:number, price_data:any}[], metaData:MetaData, entityManager?:EntityManager){
        const x = Date.now()
        if(entityManager===undefined)
            entityManager = this.pdmDataSource.createEntityManager()
        const categoryIds = [...new Set(priceData.map(x=>x.category_id))]
        let pricingAttributeGroupId
        try{
            [{pricingAttributeGroupId}] = await this.pdmReaderDataSource.manager.query(`SELECT id AS "pricingAttributeGroupId" FROM attribute_groups WHERE attribute_group_name = $1 AND tenant_id = $2 AND org_id = $3`, [PRICING_INFO_ATTRIBUTE_GROUP_NAME, metaData.tenant_id, metaData.org_id])
        }catch(e){
            throw new HttpException(`Pricing not configured for this tenant`, 201)
        }
        let getAllResponseDatas = []
        const categoryWiseAttributes = await this.pdmReaderDataSource.manager.query(`
            with 
                category_wise_attributes as (
                    select * from category_assignment where attribute_group_id = $1 and tenant_id = $2 and org_id = $3 and category_id in (${categoryIds}) and deleted_at is null
                ),
                attributes as (
                    select * from attributes where attribute_group_id = $1 and tenant_id = $2 and org_id = $3 and deleted_at is null
                ),
                tenant_category_paths as (
                    select * from tenant_category_paths where id in (${categoryIds}) and tenant_id = $2 and org_id = $3
                ),
                rules as (
                    select * from rules where tenant_id = $2 and org_id = $3
                )
                select attributes.id,
                    attributes.attribute_db_name,
                    attributes.short_name,
                    attributes.display_name,
                    attributes.attribute_type,
                    attributes.attribute_data_type,
                    attributes.constraint,
                    attributes.master_id,
                    attributes.reference_master_id,
                    attributes.reference_attribute_id,
                    category_wise_attributes.filter, 
                    category_wise_attributes.length, 
                    category_wise_attributes.mandatory, 
                    category_wise_attributes.status,
                    category_wise_attributes.filter,
                    category_wise_attributes.editable,
                    category_wise_attributes.visibility,
                    category_wise_attributes.category_id,
                    ARRAY_AGG(rules.rule_id) as rule_id
                from category_wise_attributes
                    left join attributes
                        on category_wise_attributes.attribute_id = attributes.id
                    left join tenant_category_paths 
                        on category_wise_attributes.category_id = tenant_category_paths.id
                    left join rules 
                        on rules.category_id = any(tenant_category_paths.id_path)
                        and rules.attribute_id = category_wise_attributes.attribute_id
                    group by (attributes.id,
                        attributes.attribute_db_name,
                        attributes.short_name,
                        attributes.display_name,
                        attributes.attribute_type,
                        attributes.attribute_data_type,
                        attributes.constraint,
                        attributes.master_id,
                        attributes.reference_master_id,
                        attributes.reference_attribute_id,
                        attributes.quantifier_master_id,
                        attributes.quantifier_attribute_id,
                        category_wise_attributes.filter, 
                        category_wise_attributes.length, 
                        category_wise_attributes.mandatory, 
                        category_wise_attributes.status,
                        category_wise_attributes.filter,
                        category_wise_attributes.editable,
                        category_wise_attributes.visibility,
                        category_wise_attributes.category_id)
        `, [pricingAttributeGroupId, metaData.tenant_id, metaData.org_id])
        const singleCategoryAttributes = categoryWiseAttributes.filter(x=>x.category_id==categoryIds[0])
        // console.log(singleCategoryAttributes)
        const pricingAttributesInProduct:Attribute[] = await this.pdmDataSource.manager.query(`
            SELECT * FROM attributes WHERE attribute_name = ANY($1) AND tenant_id = $2 AND org_id = $3
        `, [PRICE_ATTRIBUTES_IN_PRODUCT, metaData.tenant_id, metaData.org_id])

        const pricingColumns = singleCategoryAttributes.map(x=>`product_price.price->>'${x.attribute_db_name}' AS "${x.attribute_db_name}"`)
        pricingColumns.push(`coalesce((product_price.price->>'static_mrp')::boolean, false) AS "static_mrp"`)
        pricingColumns.push(`product_price.price->>'promotion_enabled' AS "promotion_enabled"`)
        const priceInProductColumns = pricingAttributesInProduct.map(x=>`product_data.product_data->>'${x.attribute_db_name}' AS "${x.attribute_db_name}"`)
        const existingPriceValues = await entityManager.query(`
            WITH
                product_price AS (
                    SELECT pdm_id, category_id, location_id, ${pricingColumns} FROM product_price WHERE tenant_id = $1 AND org_id = $2 AND (pdm_id, category_id, location_id) IN (${priceData.map(x=>`(${x.pdm_id}, ${x.category_id}, ${x.location_id})`)})
                ),
                product_data AS (
                    SELECT pdm_id, category_id, ${priceInProductColumns} FROM product_data WHERE tenant_id = $1 AND org_id = $2 AND (pdm_id, category_id) IN (${priceData.map(x=>`(${x.pdm_id}, ${x.category_id})`)})
                ),
                default_product_attributes AS (
                    SELECT pdm_id, category_id, code, product_name FROM default_product_attributes WHERE tenant_id = $1 AND org_id = $2 AND (pdm_id, category_id) IN (${priceData.map(x=>`(${x.pdm_id}, ${x.category_id})`)})
                ),
                product_metadata as (
                    SELECT classification, pdm_id, category_id FROM product_metadata WHERE tenant_id = $1 AND org_id = $2 AND (pdm_id, category_id) IN (${priceData.map(x=>`(${x.pdm_id}, ${x.category_id})`)})
                )
                SELECT * FROM product_price
                    LEFT JOIN 
                        product_data
                    ON  product_price.pdm_id = product_data.pdm_id
                    AND product_price.category_id = product_data.category_id
                    LEFT JOIN
                        default_product_attributes
                    ON  product_price.pdm_id = default_product_attributes.pdm_id
                    AND product_price.category_id = default_product_attributes.category_id
                    LEFT JOIN
                        product_metadata
                    ON  product_price.pdm_id = product_metadata.pdm_id
                    AND product_price.category_id = product_metadata.category_id
            `, [metaData.tenant_id, metaData.org_id])

        // const columnMetadatas = 
        let businessRulesPromises = []
        for(let [i, data] of priceData.entries()){
            const existingPriceValue = existingPriceValues.find(x=>x.pdm_id===data.pdm_id && x.category_id === data.category_id && x.location_id===data.location_id)

            const isMRPStatic = existingPriceValue?.static_mrp ?? false
            if(isMRPStatic || priceData[i].price_data['mrp'] == 0){
                delete priceData[i].price_data['mrp']
                delete priceData[i].price_data['mrp_loose_10541']
            }
            let isPromotionAndLooseProduct = false
            if(existingPriceValue!=undefined){
                isPromotionAndLooseProduct = (existingPriceValue.classification==='Variants' && existingPriceValue?.promotion_enabled?.toString()=='5140')
            }

            let isPromotion = false;
            isPromotion = existingPriceValue?.promotion_enabled?.toString()=='5140';

            if(existingPriceValue!=undefined)
                data = {...existingPriceValue, ...data}
            const getAllResponseData:any = {
                id:data.pdm_id.toString() + data.location_id.toString(),
                pdm_id:data.pdm_id,
                category_id:data.category_id,
                location_id:data.location_id,
                channel_id:data.channel_id,
                lang_code:DEFAULT_LANGUAGE,
                data:[]
            }
            if(isPromotion)
                data['promotion_enabled'] = '5141'

            const columnMetadatas = this.getColumnMetaData([...singleCategoryAttributes, ...pricingAttributesInProduct])
            for(let columnMetadata of columnMetadatas){
                if(columnMetadata.price_attribute){
                    let categoryWiseAttribute = categoryWiseAttributes.find(x=>x.category_id === data.category_id && x.attribute_db_name === columnMetadata.attribute_db_name)
                    if(categoryWiseAttribute===undefined)
                        categoryWiseAttribute = JSON.parse(JSON.stringify(columnMetadata))
                    columnMetadata = {
                        ...categoryWiseAttribute,
                        key:columnMetadata.attribute_db_name,
                        "price_attribute":true,
                        rule_id:(categoryWiseAttribute?.rule_id?.find(x=>x!=null)===undefined) ? (null):("rule_applied"),
                        target_rule_only:categoryWiseAttribute?.target_rule_only ?? false,
                    }
                }
                const obj:any = {
                    ...columnMetadata,
                    attribute_value:data[columnMetadata.attribute_db_name] ?? null
                }
                obj['attr_block'] = (obj['dependent']===false && obj['rule_id']!='' && obj['attribute_value']!=null)?(true):(false)
                delete obj['key']
                getAllResponseData.data.push(obj)
            }

            

            const response = await this.businessRuleService.getPricingRuleEvaluation(getAllResponseData, metaData)

            delete response['id']
            priceData[i].price_data = {...priceData[i].price_data, ...response}

            if(isPromotion)
                priceData[i].price_data['promotion_enabled'] = '5140'

            if(isPromotionAndLooseProduct){
                const columnsToRetain = [
                    'map',
                    'vendor_margin',
                    'map_with_vm',
                    'map_with_vm_tax',
                    'cess_10475',
                    'sgst',
                    'cgst',
                    'total_tax'
                ]
                for(let key in priceData[i].price_data){
                    if(columnsToRetain.includes(key))
                        continue
                    delete priceData[i].price_data[key]
                }
            }

            if(isPromotion){
                const columnsToRetain = [
                    'mrp',
                    'map',
                    'vendor_margin',
                    'map_with_vm',
                    'map_with_vm_tax',
                    'cess_10475',
                    'sgst',
                    'cgst',
                    'total_tax'
                ]
                for(let key in priceData[i].price_data){
                    if(columnsToRetain.includes(key))
                        continue
                    delete priceData[i].price_data[key]
                }
            }

            for(let key in priceData[i].price_data){
                if(priceData[i].price_data[key]===null || priceData[i].price_data[key]===undefined)
                    continue
                if(!isNaN(priceData[i].price_data[key])){
                    if(!Number.isInteger(priceData[i].price_data[key]))
                        priceData[i].price_data[key] = parseFloat(priceData[i].price_data[key]).toFixed(2)
                } 
            }
        }

        console.log(`Total Time For Business Rules: ${Date.now()-x}`)
        console.log(`done for batch`)
        return priceData
    }
}
