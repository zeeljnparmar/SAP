import { InjectDataSource } from "@nestjs/typeorm"
import { VARIANT_ATTRIBUTE_GROUP_NAME } from "src/constants/constants"
import { Attribute, MetaData, PDM, ReferenceValue } from "src/dtos/new.new.sku.dto"
import { DataSource } from "typeorm"

export class CommonService {


    constructor(
        // @InjectRepository(UserSelectedLanguages, 'pdm') private userSelectedLanguagesRepository:Repository<UserSelectedLanguages>,
        @InjectDataSource(`pdm`) private pdmDataSource: DataSource,

    ) { }

    async getFlattenedAttributes(rawPdm: PDM) {
        return rawPdm.attribute_groups.filter(x => x.attribute_group_name != VARIANT_ATTRIBUTE_GROUP_NAME).flatMap(x => x.attributes).filter(x => x != undefined)
    }

        async getReferenceIdsFromValues(body:Attribute, languageCode:string, metaData:MetaData, values:any[]):Promise<ReferenceValue[]>{
        const langCode = await this.getLangCodeAppendToTable(languageCode)
        const parameters = []
        for(let [i,value] of values.entries()){
            parameters.push(`$${i}`)
        }
        const response = await this.pdmDataSource.createEntityManager().connection.createQueryBuilder()
            .select(`(array_agg(rmdm_id))[1]`, `id`)
            .addSelect(`"value"`)
            .from(`reference_master_data${langCode}`, null)
            .where(`LOWER("value") IN (:...value)`, { value: values.map(x=>x.toString().toLowerCase()) })
            .andWhere(`tenant_id = :tenant_id`, { tenant_id: metaData.tenant_id })
            .andWhere(`org_id = :org_id`, { org_id: metaData.org_id })
            .andWhere(`ra_id = :ra_id`, { ra_id: body.reference_attribute_id })
            .andWhere(`rm_id = :rm_id`, { rm_id: body.reference_master_id })
            .groupBy("value")
            .getRawMany()

        return response
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

    async getLangCodeAppendToTable(langCode: string) {
        if (langCode === 'en' || langCode === '') return ''
        else if (langCode[0] === '_') return langCode
        else return '_' + langCode
    }
}