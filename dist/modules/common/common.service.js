"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonService = void 0;
const typeorm_1 = require("@nestjs/typeorm");
const constants_1 = require("../../constants/constants");
const typeorm_2 = require("typeorm");
let CommonService = class CommonService {
    pdmDataSource;
    constructor(pdmDataSource) {
        this.pdmDataSource = pdmDataSource;
    }
    async getFlattenedAttributes(rawPdm) {
        return rawPdm.attribute_groups.filter(x => x.attribute_group_name != constants_1.VARIANT_ATTRIBUTE_GROUP_NAME).flatMap(x => x.attributes).filter(x => x != undefined);
    }
    async getReferenceIdsFromValues(body, languageCode, metaData, values) {
        const langCode = await this.getLangCodeAppendToTable(languageCode);
        const parameters = [];
        for (let [i, value] of values.entries()) {
            parameters.push(`$${i}`);
        }
        const response = await this.pdmDataSource.createEntityManager().connection.createQueryBuilder()
            .select(`(array_agg(rmdm_id))[1]`, `id`)
            .addSelect(`"value"`)
            .from(`reference_master_data${langCode}`, null)
            .where(`LOWER("value") IN (:...value)`, { value: values.map(x => x.toString().toLowerCase()) })
            .andWhere(`tenant_id = :tenant_id`, { tenant_id: metaData.tenant_id })
            .andWhere(`org_id = :org_id`, { org_id: metaData.org_id })
            .andWhere(`ra_id = :ra_id`, { ra_id: body.reference_attribute_id })
            .andWhere(`rm_id = :rm_id`, { rm_id: body.reference_master_id })
            .groupBy("value")
            .getRawMany();
        return response;
    }
    async getReferenceValues(body, languageCode, metaData, rmIds) {
        const langCode = await this.getLangCodeAppendToTable(languageCode);
        let rmIdWhereCondition = ``;
        if (rmIds != undefined && !rmIds.includes(undefined)) {
            for (let [i, rmId] of rmIds.entries()) {
                if (rmId === undefined)
                    continue;
                if (rmId.toString().includes('[') && rmId.toString().includes(']'))
                    rmIds[i] = JSON.parse(rmId);
            }
            rmIds = rmIds.flatMap(x => x);
            rmIdWhereCondition = `AND rmdm_id IN (${rmIds})`;
        }
        const referenceValues = await this.pdmDataSource.manager.query(`SELECT rmdm_id AS id, value, status 
            FROM reference_master_data${langCode} 
            WHERE ra_id=$1
            AND rm_id=$2
            AND tenant_id=$3
            AND org_id=$4
            AND deleted_at isNull ${rmIdWhereCondition} 
            and value is not null
            --AND status = true`, [body.reference_attribute_id, body.reference_master_id, metaData.tenant_id, metaData.org_id]);
        return referenceValues;
    }
    async getLangCodeAppendToTable(langCode) {
        if (langCode === 'en' || langCode === '')
            return '';
        else if (langCode[0] === '_')
            return langCode;
        else
            return '_' + langCode;
    }
};
exports.CommonService = CommonService;
exports.CommonService = CommonService = __decorate([
    __param(0, (0, typeorm_1.InjectDataSource)(`pdm`)),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], CommonService);
//# sourceMappingURL=common.service.js.map