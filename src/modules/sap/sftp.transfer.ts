import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { PimUploadService } from "./pim.update";
import { DEFAULT_LANGUAGE, STARQUIK_SFTP_HOST, STARQUIK_SFTP_PASSWORD, STARQUIK_SFTP_USERNAME } from "src/constants/constants";
import { Attribute, MetaData, ReferenceValue } from "src/dtos/new.new.sku.dto";
import { BusinessDataModelService } from "../interservice/business.data.model.service";
import { CommonService } from "../common/common.service";
let Client = require('ssh2-sftp-client');
let sftp = new Client();
var parser = require('xml2json');

const config = {
    host: STARQUIK_SFTP_HOST,
    port: 22,
    username: STARQUIK_SFTP_USERNAME,
    password: STARQUIK_SFTP_PASSWORD
}

interface sftpFileList{
    name: string,
    size: number,
    modifyTime: number,
    accessTime: number,
}

@Injectable()
export class SAPService{

    constructor(
        @InjectDataSource('pdm') private pdmDataSource:DataSource,
        @InjectDataSource('pdmReader') private pdmReaderDataSource:DataSource,
        private readonly productPricingService:PimUploadService,
        private readonly businessDataModelService:BusinessDataModelService,
        private readonly commonService:CommonService

        
    ){}

    async removeDuplicatesRetainLast(arr, key) {
        const uniqueMap = new Map();

        for (let i = arr.length - 1; i >= 0; i--) {
            const obj = arr[i];
            uniqueMap.set(obj[key], obj);
        }

        return Array.from(uniqueMap.values());
    }

    async sftpPriceTransfer(sftp){
        // if(dateTimeStr===undefined) dateTimeStr = ``
        //PRIMAS
        const remoteDir = `/starquik/PROD/Outbound/PIM`

        let files:sftpFileList[]
        const a = Date.now()
        const lastestFile = await this.pdmDataSource.manager.query(`
            select sftp_updated_at from sap_price_files_history
                where file_type = 'PRIMAS'
                order by sftp_updated_at desc limit 1
        `)
        if(lastestFile.length===0)
            files = await sftp.list(remoteDir, (file)=>file.name.includes(`PRIMAS`) && file.name.includes('.xml') && file.size!=0)
        else{
            const dateObject = new Date(lastestFile[0].sftp_updated_at);
            const timestampInMs = dateObject.getTime();
            files = await sftp.list(remoteDir, (file)=>file.modifyTime > timestampInMs && file.name.includes(`PRIMAS`) && file.name.includes('.xml') && file.size!=0)
        }
        console.log(`Getting All Files: ${Date.now()-a}ms`)
        files.sort((a,b)=>a.modifyTime-b.modifyTime)

        let i = 0
        for(let file of files){
            let timeStr = ``
            let a = Date.now()
            i++
            // console.log(`${i}----${file.name}`)
            const str = (await sftp.get(`${remoteDir}/${file.name}`)).toString()
            timeStr += `Getting File:${Date.now()-a}ms || `
            a = Date.now()
            const z = Date.now()
            let json
            try{
                json = parser.toJson(str, {coerce: false,object:true})
            }catch(e){
                await this.pdmDataSource.query(`
                    INSERT INTO sap_price_files_history ("store_code", "filename", "sftp_updated_at", "file_type", "total_articles", "articles_list", "processing_status")
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT ("filename", "sftp_updated_at")
                    DO NOTHING
            `, [null, file.name, new Date(file.modifyTime).toISOString(), 'INVMAS', 0, [], 'error'])
                console.log(e)
                continue
            }
            if(Object.keys(json).length===0)
                continue
            const mongodb = Array.isArray(json.root.data.article_list)?(json.root.data.article_list):([json.root.data.article_list])
            const x = mongodb.map(x=>{
                return {...x, store_code:json.root.data.store_code}
            })
            timeStr += `Parse To JSON:${Date.now()-a}ms || `
            a = Date.now()
            const uniqueX = await this.removeDuplicatesRetainLast(x, 'Article_Number')
            timeStr += `Removing Dups:${Date.now()-a}ms || `
            a = Date.now()
            //SAP History Table
            let values:string[] = []
            const allArticles = uniqueX.map(x=>x.Article_Number)
            // for(let d of uniqueX){
            //     values.push(`('${d.store_code}', '${file.name}', '${new Date(file.modifyTime).toISOString()}', 'PRIMAS', ${allArticles.length}, '{${allArticles}}')`)
            // }
            await this.pdmDataSource.query(`
                INSERT INTO sap_price_files_history ("store_code", "filename", "sftp_updated_at", "file_type", "total_articles", "articles_list")
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT ("filename", "sftp_updated_at")
                DO NOTHING
            `, [uniqueX[0].store_code, file.name, new Date(file.modifyTime).toISOString(), 'PRIMAS', allArticles.length, allArticles])
            timeStr += `File History Table:${Date.now()-a}ms || `
            a = Date.now()
            // await this.pdmDataSource.query(`
            //     INSERT INTO sap_file_history ("Article_Number", "store_code", "filename", "last_modified_sap", "file_type", "status")
            //     VALUES ${values}
            //     ON CONFLICT ("Article_Number", "store_code", "filename", "last_modified_sap")
            //     DO NOTHING
            // `)

            //SAP Price Table
            values = []
            for(let d of uniqueX){
                values.push(`('${d.Article_Number}', '${d.store_code}', ${d.MRP}, '${file.name}', 'pending')`)
            }
            await this.pdmDataSource.query(`
                INSERT INTO sap_prices ("Article_Number", "store_code", "MRP", "PRIMAS_file", "processing_status")
                VALUES ${values}
                ON CONFLICT ("Article_Number", "store_code")
                DO UPDATE SET 
                    old_mrp = sap_prices."MRP",
                    "MRP" = EXCLUDED."MRP",
                    "PRIMAS_file" = EXCLUDED."PRIMAS_file"
            `)
            timeStr += `Price Table:${Date.now()-a}ms || `
            a = Date.now()
            const fromPath = `${remoteDir}/${file.name}`
            const toPath = `${remoteDir}/Archive/${file.name}`
            try{
                sftp.posixRename(fromPath, toPath).catch((error)=>{
                    console.log(`error moving file`)
                })
            }catch(e){
            }
            timeStr += `Renaming:${Date.now()-a}ms`
            a = Date.now()
            console.log(`${i}----${file.name}--${timeStr} || Total Time:${Date.now()-z}ms`)
        }
    }

    async convertToXML(str:string){
        return parser.toJson(str, {coerce: false,object:true})
    }

    async sftpInvTransfer(sftp){
        // if(dateTimeStr===undefined) dateTimeStr = ``
        //INVMAS
        const remoteDir = `/starquik/PROD/Outbound/PIM_Inventory`
        let files:sftpFileList[]
        const a = Date.now()
        const lastestFile = await this.pdmDataSource.manager.query(`
            select sftp_updated_at from sap_price_files_history
                where file_type = 'INVMAS'
                order by sftp_updated_at desc limit 1
        `)
        if(lastestFile.length===0)
            files = await sftp.list(remoteDir, (file)=>file.name.includes(`INVMAS`) && file.name.includes('.xml') && file.size!=0)
        else{
            const dateObject = new Date(lastestFile[0].sftp_updated_at);
            const timestampInMs = dateObject.getTime();
            files = await sftp.list(remoteDir, (file)=>file.modifyTime > timestampInMs && file.name.includes(`INVMAS`) && file.name.includes('.xml') && file.size!=0)
        }
        // console.log(`Getting All Files: ${Date.now()-a}ms`)
        files.sort((a,b)=>a.modifyTime-b.modifyTime)
        let i = 0
        for(let file of files){
            // console.log(`${i}----${file.name}`)
            let timeStr = ``
            let a = Date.now()
            i++
            // console.log(i)
            const str = (await sftp.get(`${remoteDir}/${file.name}`)).toString()
            timeStr += `Getting File:${Date.now()-a}ms || `
            a = Date.now()
            const z = Date.now()
            let json
            try{
                json = parser.toJson(str, {coerce: false,object:true})
            }catch(e){
                await this.pdmDataSource.query(`
                    INSERT INTO sap_price_files_history ("store_code", "filename", "sftp_updated_at", "file_type", "total_articles", "articles_list", "processing_status")
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT ("filename", "sftp_updated_at")
                    DO NOTHING
            `, [null, file.name, new Date(file.modifyTime).toISOString(), 'INVMAS', 0, [], 'error'])
                console.log(e)
                continue
            }
            if(Object.keys(json).length===0)
                continue
            // console.log(`here 3`)
            const mongodb = Array.isArray(json.root.data.article_list)?(json.root.data.article_list):([json.root.data.article_list])
            const x = mongodb.map(x=>{
                return {...x, store_code:json.root.data.store_code}
            })
            timeStr += `Parse To JSON:${Date.now()-a}ms || `
            a = Date.now()
            const uniqueX = await this.removeDuplicatesRetainLast(x, 'Article_Number')
            timeStr += `Removing Dups:${Date.now()-a}ms || `
            a = Date.now()
            //SAP History Table
            let values:string[] = []
            const allArticles = uniqueX.map(x=>x.Article_Number)
            // for(let d of uniqueX){
            //     values.push(`('${d.store_code}', '${file.name}', '${new Date(file.modifyTime).toISOString()}', 'INVMAS', ${allArticles.length}, '{${allArticles}}')`)
            // }
            await this.pdmDataSource.query(`
                INSERT INTO sap_price_files_history ("store_code", "filename", "sftp_updated_at", "file_type", "total_articles", "articles_list")
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT ("filename", "sftp_updated_at")
                DO NOTHING
            `, [uniqueX[0].store_code, file.name, new Date(file.modifyTime).toISOString(), 'INVMAS', allArticles.length, allArticles])
            timeStr += `File History Table:${Date.now()-a}ms || `
            a = Date.now()
            //SAP Price Table
            values = []
            for(let d of uniqueX){
                values.push(`('${d.Article_Number}', '${d.store_code}', ${d.MAP}, '${file.name}', 'pending')`)
            }
            await this.pdmDataSource.query(`
                INSERT INTO sap_prices ("Article_Number", "store_code", "MAP", "INVMAS_file", "processing_status")
                VALUES ${values}
                ON CONFLICT ("Article_Number", "store_code")
                DO UPDATE SET 
                    old_map = sap_prices."MAP",
                    "MAP" = EXCLUDED."MAP",
                    "INVMAS_file" = EXCLUDED."INVMAS_file"
            `)
            timeStr += `Price Table:${Date.now()-a}ms || `
            a = Date.now()
            const fromPath = `${remoteDir}/${file.name}`
            const toPath = `${remoteDir}/Archive/${file.name}`
            try{
                sftp.posixRename(fromPath, toPath).catch((error)=>{
                    console.log(`error moving file`)
                })
            }catch(e){
            }
            timeStr += `Renaming:${Date.now()-a}ms`
            a = Date.now()
            console.log(`${i}----${file.name}--${timeStr} || Total Time:${Date.now()-z}ms`)
        }
    }

    async sftpArtTransfer(sftp){
        // await sftp.connect(config)
    
        //ARTMAS
        const remoteDir = `/starquik/PROD/Outbound/PIM`
    
        let files//:sftpFileList[]
        const a = Date.now()
    
        const lastestFile = await this.pdmDataSource.manager.query(`
            select sftp_updated_at from sap_price_files_history
                where file_type = 'ARTMAS'
                order by sftp_updated_at desc limit 1
        `)
        // console.log(lastestFile)
        if(lastestFile.length===0)
            files = await sftp.list(remoteDir, (file)=>file.name.includes(`ARTMAS`) && file.name.includes('.xml') && file.size!=0)
        else{
            const dateObject = new Date(lastestFile[0].sftp_updated_at);
            const timestampInMs = dateObject.getTime();
            // console.log(timestampInMs)
            files = await sftp.list(remoteDir, (file)=>file.modifyTime > timestampInMs && file.name.includes(`ARTMAS`) && file.name.includes('.xml') && file.size!=0)
            // console.log(files[0])
        }
    
        // console.log(`Getting All Files: ${Date.now()-a}ms || Total `)
        console.log(`---------- 📂 Total files to process: ${files.length}`);
        files.sort((a,b)=>a.modifyTime-b.modifyTime)
        let i = 0;
        // console.log(files)
        // const batchSize = 10
        let batchData = []
        for(let file of files){
            let timeStr = ``;
            let a = Date.now();
            const z = Date.now();
            i++;
            // console.log(file)
            // console.log(i)
            // console.log(batchData)
            const process = await Promise.all([sftp.get(`${remoteDir}/${file.name}`), ...batchData])
            batchData = []
            const str = process[0].toString()
            timeStr += `Getting File:${Date.now()-a}ms || `
            a = Date.now()
            let json
            try{
                json = parser.toJson(str, {coerce: false,object:true})
            }catch(e){
                console.log(`----------- ${i + 1} - ⚠️ ${file.name} | Error in parsing`);
                continue
            }
            if(Object.keys(json).length===0){
                console.log(`----------- ${i + 1} - ⚠️ ${file.name} | Error because empty file arrived`);
                continue
            }

            const escapeString = (str) => {
                if (!str) return '';
                return str.toString().replace(/'/g, "''");
            };

            const getTaxValue = (value) => {
                if (!value || Object.keys(value).length === 0) return 0;
                return Number(value) || 0;
            };

            const getNumberValue = (value) => {
                if (!value || Object.keys(value).length === 0) return 0;
                return Number(value) || 0;
            };
                
                
            // console.log(`here 3`)
            const postgresArray = Array.isArray(json.root.data)?(json.root.data):([json.root.data])
            timeStr += `Parse To JSON:${Date.now()-a}ms || `
            a = Date.now()
            const uniqueX = await this.removeDuplicatesRetainLast(postgresArray, 'Article_Number')
            timeStr += `Removing Dups:${Date.now()-a}ms || `
            a = Date.now()
            //SAP History Table
            let values = []
            const allArticles = uniqueX.map(x=>x.Article_Number)
            // for(let d of uniqueX){
            //     values.push(`('${d.store_code}', '${file.name}', '${new Date(file.modifyTime).toISOString()}', 'INVMAS', ${allArticles.length}, '{${allArticles}}')`)
            // }
    
            timeStr += `File History Table:${Date.now()-a}ms || `
            a = Date.now()
            //SAP Price Table
            values = []
            // console.log(postgresArray)
            let parameters = []
            // let i = 1
            for(let d of postgresArray){
                // console.log(d)
                if(d.Article_Number===undefined) continue
               
                values.push(`('${d.Article_Number}', 
                '${d.store_code}', 
                '${escapeString(d.Article_Desc)}', 
                '${escapeString(d.Brand)}', 
                ${getTaxValue(d.CESS)}, 
                ${getTaxValue(d.CGST)}, 
                '${escapeString(d.Shelf_life)}', 
                '${escapeString(d.UOM)}', 
                ${getNumberValue(d.Weight)}, 
                ${getNumberValue(d.Width)}, 
                '${escapeString(d.subcat_code)}', 
                '${new Date().toISOString()}', 
                '${new Date().toISOString()}')`);
                
                parameters.push(d.Article_Desc)
                // i++
            }
            const productData = this.pdmDataSource.manager.query(`
                INSERT INTO sap_product_data ("Article_Number", "store_code", "Article_Desc", "Brand", "CESS", "CGST", "Shelf_life", "UOM", "Weight", "Width", "subcat_code", "created_at", "updated_at")
                VALUES ${values}
                ON CONFLICT ("Article_Number")
                DO UPDATE SET 
                    "Article_Desc" = EXCLUDED."Article_Desc", 
                    "Brand" = EXCLUDED."Brand", 
                    "CESS" = EXCLUDED."CESS", 
                    "CGST" = EXCLUDED."CGST",
                    "Shelf_life" = EXCLUDED."Shelf_life", 
                    "UOM" = EXCLUDED."UOM", 
                    "Weight" = EXCLUDED."Weight", 
                    "Width" = EXCLUDED."Width", 
                    "subcat_code" = EXCLUDED."subcat_code", 
                    "updated_at" = EXCLUDED."updated_at"
            `)
            batchData.push(productData)
            values = []
            for(let d of postgresArray){
                values.push(`('${d.Article_Number}',
                              '${d.store_code}',
                              ${d.Status==="A1"?true:false},
                              '${new Date(Date.now()).toISOString()}',
                              '${new Date(Date.now()).toISOString()}')`)
            }
            const storeStatus = this.pdmDataSource.manager.query(`
                INSERT INTO sap_store_status ("Article_Number", "store_code", "status", "created_at", "updated_at")
                VALUES ${values}
                ON CONFLICT ("Article_Number", "store_code")
                DO UPDATE SET 
                    "status" = EXCLUDED."status", 
                    "updated_at" = EXCLUDED."updated_at"
            `)
            // console.log(storeStatus)
            batchData.push(storeStatus)
            const history = this.pdmDataSource.manager.query(`
                INSERT INTO sap_price_files_history ("store_code", "filename", "sftp_updated_at", "file_type", "total_articles", "articles_list")
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT ("filename", "sftp_updated_at")
                DO NOTHING
            `, [uniqueX[0].store_code, file.name, new Date(file.modifyTime).toISOString(), 'ARTMAS', allArticles.length, allArticles])
            batchData.push(history)
            timeStr += `Status Table:${Date.now()-a}ms || `
            a = Date.now()
            // if(batchData.length>batchSize){
            //     await Promise.all(batchData)
            //     batchData = []
            // }
            const fromPath = `${remoteDir}/${file.name}`
            const toPath = `${remoteDir}/Archive/${file.name}`
            try{
                sftp.posixRename(fromPath, toPath).catch((error)=>{
                    console.log(`error moving file`)
                })
            }catch(e){
            }
            timeStr += `Renaming:${Date.now()-a}ms`
            a = Date.now()
            console.log(`----------- ${i + 1} - ✅ ${file.name} | ${timeStr} | Total:${Date.now() - z}ms`);
            // console.log(`${i}----${file.name}--${timeStr} || Total Time:${Date.now()-z}ms`)
        }
        if(batchData.length>0){
            await Promise.all(batchData)
        }
        // await sftp.end()
    }

    async sftpEanTransfer(sftp){
        //ARTMAS
        const remoteDir = `/starquik/PROD/Outbound/PIM`

        let files:sftpFileList[]
        const a = Date.now()

        let lastestFile = await this.pdmDataSource.manager.query(`
            select sftp_updated_at from sap_price_files_history
                where file_type = 'EANMAS'
                order by sftp_updated_at desc limit 1
        `)
        // console.log(lastestFile)
        if(lastestFile.length===0)
            files = await sftp.list(remoteDir, (file)=>file.name.includes(`EANMAS`) && file.name.includes('.xml') && file.size!=0)
        else{
            const dateObject = new Date(lastestFile[0].sftp_updated_at);
            const timestampInMs = dateObject.getTime();
            // console.log(timestampInMs)
            files = await sftp.list(remoteDir, (file)=>file.modifyTime > timestampInMs && file.name.includes(`EANMAS`) && file.name.includes('.xml') && file.size!=0)
            // console.log(files[0])
        }

        console.log(`Getting All Files: ${Date.now()-a}ms`)
        files.sort((a,b)=>a.modifyTime-b.modifyTime)
        let i = 0
        // console.log(files[files.length-1])
        // return
        // const batchSize = 10
        let batchData:any[] = []
        for(let file of files){
            let timeStr = ``
            let a = Date.now()
            const z = Date.now()
            i++
            // console.log(file)
            // console.log(i)
            const process = await Promise.all([sftp.get(`${remoteDir}/${file.name}`), ...batchData])
            // console.log(process[1])
            // console.log(process[2])
            // console.log(process[3])
            batchData = []
            const str = process[0].toString()
            timeStr += `Getting File:${Date.now()-a}ms || `
            a = Date.now()
            let json
            try{
                json = parser.toJson(str, {coerce: false,object:true})
            }catch(e){
                continue
            }
            if(Object.keys(json).length===0)
                continue
            // console.log(`here 3`)
            const postgresArray = Array.isArray(json.root.data)?(json.root.data):([json.root.data])
            timeStr += `Parse To JSON:${Date.now()-a}ms || `
            a = Date.now()
            const uniqueX = await this.removeDuplicatesRetainLast(postgresArray, 'Article_Number')
            timeStr += `Removing Dups:${Date.now()-a}ms || `
            a = Date.now()
            //SAP History Table
            let values:string[] = []
            const allArticles = uniqueX.map(x=>x.Article_Number)
            // for(let d of uniqueX){
            //     values.push(`('${d.store_code}', '${file.name}', '${new Date(file.modifyTime).toISOString()}', 'INVMAS', ${allArticles.length}, '{${allArticles}}')`)
            // }

            timeStr += `File History Table:${Date.now()-a}ms || `
            a = Date.now()
            //SAP Price Table
            values = []
            // console.log(postgresArray)
            for(let d of postgresArray){
                // console.log(d)
                if(d.Article_Number===undefined) continue
                const gs1CodeArray = d.GS1_code.split(',').map(x=>`'${x}'`)
                values.push(`('${d.Article_Number}', ARRAY[${gs1CodeArray}], '${new Date(Date.now()).toISOString()}', '${new Date(Date.now()).toISOString()}')`)
            }
            const productData = this.pdmDataSource.manager.query(`
                INSERT INTO sap_product_data ("Article_Number", "GS1_Code", "created_at", "updated_at")
                VALUES ${values}
                ON CONFLICT ("Article_Number")
                DO UPDATE SET 
                    "GS1_Code" = sap_product_data."GS1_Code" || EXCLUDED."GS1_Code",
                    "updated_at" = EXCLUDED."updated_at"
            `)
            batchData.push(productData)
            const history = this.pdmDataSource.manager.query(`
                INSERT INTO sap_price_files_history ("store_code", "filename", "sftp_updated_at", "file_type", "total_articles", "articles_list")
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT ("filename", "sftp_updated_at")
                DO NOTHING
            `, [uniqueX[0].store_code, file.name, new Date(file.modifyTime).toISOString(), 'ARTMAS', allArticles.length, allArticles])
            batchData.push(history)
            timeStr += `Status Table:${Date.now()-a}ms || `
            a = Date.now()
            // if(batchData.length>batchSize){
            //     await Promise.all(batchData)
            //     batchData = []
            // }
            const fromPath = `${remoteDir}/${file.name}`
            const toPath = `${remoteDir}/Archive/${file.name}`
            try{
                // sftp.posixRename(fromPath, toPath).catch((error)=>{
                //     console.log(`error moving file`)
                // })
            }catch(e){
            }
            timeStr += `Renaming:${Date.now()-a}ms`
            a = Date.now()
            console.log(`${i}----${file.name}--${timeStr} || Total Time:${Date.now()-z}ms`)
        }
        if(batchData.length>0){
            await Promise.all(batchData)
        }
    }

    async dateToTime(a:string){
        const year = a.substring(0, 4);
        const month = a.substring(4, 6);
        const day = a.substring(6, 8);
        const time = '20:00:00';
        const timezoneOffset = '+05:30';
        const isoDateString = `${year}-${month}-${day}T${time}${timezoneOffset}`;
        return isoDateString
    }

    async removeStaticMrpInconsistencies(metaData:MetaData){
        await this.pdmDataSource.manager.query(`
            with sss as (
                select * from sap_prices where (processing_status = 'done' or processing_status = 'updatedButNotChanged') and "MRP" is not null and "MRP" <> 0.00
            ),
            dp as (
                select pdm_id, article_no from default_product_attributes where tenant_id = 'IND0015' and org_id = 'OR0001' and code is not null 
            ),
            pm as (
                select pdm_id, coalesce(parent_pdm_id, pdm_id) as parent_pdm_id from product_metadata where tenant_id = 'IND0015' and org_id = 'OR0001'
            ),
            dpa as (
                select dp.article_no, pm.pdm_id from pm join dp on pm.parent_pdm_id = dp.pdm_id
            ),
            pp as (
                select pdm_id, location_id,price->>'status' as status, (price->>'mrp')::numeric as mrp from product_price where tenant_id = 'IND0015' and org_id = 'OR0001' and (price->>'static_mrp' is null or price->>'static_mrp' ='false')
            ),
            rmd as (
                select rmdm_id, value from reference_master_data where tenant_id = 'IND0015' and ra_id <> 0 and rm_id = 1027
                and ra_id = 2835
            ),
            jt as (
                select rmd.rmdm_id as location_id, dpa.pdm_id, sss."MRP" as mrp, sss."Article_Number", sss.store_code from sss join dpa on dpa.article_no = sss."Article_Number" join rmd on
                sss.store_code = rmd.value
            ),
            update_query as (
                select jt."Article_Number", jt.store_code from pp join jt on
                pp.location_id = jt.location_id and
                pp.pdm_id = jt.pdm_id 
                and
                pp.mrp::float is distinct from jt.mrp::float
            )
            update sap_prices sp
                set processing_status = 'pending'
                FROM update_query uq
                where uq.store_code = sp.store_code
                and uq."Article_Number" = sp."Article_Number"      
        `)
    }

    async getProductFilesFromSftp(metaData:MetaData, jobId:string){
        try{
            console.log(`productSapStep1: JOB ID:${jobId}, BullMQ Message Received`)
            let sftp = new Client();
            let a = Date.now()
            await sftp.connect(config)
            try{
                await this.sftpArtTransfer(sftp)
                console.log(`productSapStep2: JOB ID:${jobId}, Art Files Insert:${Date.now()-a}ms`)
                a = Date.now()

                
            }catch(e){
                console.log(`BACKGROUND_TASK: PRODUCT_SAP_SERVICE || Job ID:${jobId} ||  Error: ${JSON.stringify(e)} || StackTrace: ${JSON.stringify(e.stack)}`);
            }finally{
                await sftp.end()
            }
            await this.productPricingService.sapTriggerStoreStatus(metaData)
            console.log(`productSapStep3: JOB ID:${jobId}, Store Status Update Done:${Date.now()-a}ms`)
            a = Date.now()
        }catch(e){
			console.log(`BACKGROUND_TASK: PRODUCT_SAP_SERVICE_OUTER || Job ID:${jobId} ||  Error: ${JSON.stringify(e)} || StackTrace: ${JSON.stringify(e.stack)}`);
            throw e
        }
    }

    async getSapFilesFromSftp(metaData:MetaData, jobId?){
        try{
            console.log(`sapstep1: JOB ID:${jobId}, BullMQ Message Received`)
            let sftp = new Client();
            const z = Date.now()
            let a = Date.now()
            console.log(`sapstep2: JOB ID:${jobId}, Connecting SFTP`)
            await sftp.connect(config)
            console.log(`sapstep3: JOB ID:${jobId}, SFTP Connected:${Date.now()-a}ms`)
            a = Date.now()
            try{
                await this.sftpPriceTransfer(sftp)
                console.log(`sapstep4: JOB ID:${jobId}, Price Files Insert:${Date.now()-a}ms`)
                a = Date.now()
        
                await this.sftpInvTransfer(sftp)
        
                console.log(`sapstep5: JOB ID:${jobId}, Inv Files Insert:${Date.now()-a}ms`)
                a = Date.now()
                
                // console.log(`sapstep6: JOB ID:${jobId}, Art Files Insert:${Date.now()-a}ms`)
                // a = Date.now()

            }catch(e){
			    console.log(`BACKGROUND_TASK: SAP_SERVICE || Job ID:${jobId} ||  Error: ${JSON.stringify(e)} || StackTrace: ${JSON.stringify(e.stack)}`);
            }finally{
                await sftp.end()
            }
    
    
            console.log(`sapstep7: JOB ID:${jobId}, SFTP Ended:${Date.now()-a}ms`)
            a = Date.now()
    
            await this.productPricingService.sapTriggerPrice(metaData, undefined, jobId)
    
            console.log(`sapstep8: JOB ID:${jobId}, Price Inserted:${Date.now()-a}ms`)
            a = Date.now()
    
            //await this.insertSapProducts(metaData)
    
            console.log(`sapstep9: JOB ID:${jobId}, Products Inserted:${Date.now()-a}ms`)
            a = Date.now()
    
            await this.removeSapStoreStatusInconsistencies(metaData)
    
            console.log(`sapstep10: JOB ID:${jobId}, Status Inconsistencies Removed:${Date.now()-a}ms`)
            a = Date.now()
    
            await this.removeStaticMrpInconsistencies(metaData)
    
            console.log(`sapstep11: JOB ID:${jobId}, MRP Inconsistencies Removed:${Date.now()-a}ms`)
            a = Date.now()
    
            console.log(`sapstep12: JOB ID:${jobId}, JOB Done & Total Time:${Date.now()-z}ms`)
        }catch(e){
			console.log(`BACKGROUND_TASK: SAP_SERVICE || Job ID:${jobId} ||  Error: ${JSON.stringify(e)} || StackTrace: ${JSON.stringify(e.stack)}`);
            throw e
        }
    } 

    async removeSapStoreStatusInconsistencies(metaData:MetaData){
        const readerQueryRunner = this.pdmReaderDataSource.createQueryRunner()
        try{
            await readerQueryRunner.connect()
            const stream = await readerQueryRunner.stream(`
                with sss as (
                    select * from sap_store_status where processing_status = 'done'
                ),
                dp as (
                    select pdm_id, article_no from default_product_attributes where tenant_id = $1 and org_id = $2 and code is not null
                ),
                pm as (
                    select pdm_id, coalesce(parent_pdm_id, pdm_id) as parent_pdm_id from product_metadata where tenant_id = $1 and org_id = $2
                ),
                dpa as (
                    select dp.article_no, pm.pdm_id from pm join dp on pm.parent_pdm_id = dp.pdm_id
                ),
                pp as (
                    select pdm_id, location_id,price->>'status' as status from product_price where tenant_id = $1 and org_id = $2
                ),
                rmd as (
                    select rmdm_id, value from reference_master_data where tenant_id = $1 and ra_id <> 0 and rm_id = 1027
                    and ra_id = 2835
                ),
                jt as (
                    select rmd.rmdm_id as location_id, dpa.pdm_id, sss.status::character varying, sss."Article_Number", sss.store_code from sss join dpa on dpa.article_no = sss."Article_Number" join rmd on
                    sss.store_code = rmd.value
                ),
                update_query as (
                    select jt."Article_Number", jt.store_code from pp join jt on
                    pp.location_id = jt.location_id and
                    pp.pdm_id = jt.pdm_id and
                    pp.status <> jt.status
                )
                select * from update_query    
            `, [metaData.tenant_id, metaData.org_id])
            let i = 0
            for await(const data of stream ){
                await this.pdmDataSource.manager.query(`
                    update sap_store_status set processing_status = 'pending' where 
                    "Article_Number" = $1 AND store_code = $2  
                `, [data["Article_Number"], data.store_code])
            }
        }finally{
            await readerQueryRunner.release()
        }
    }
}

