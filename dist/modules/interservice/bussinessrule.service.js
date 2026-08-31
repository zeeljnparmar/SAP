"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRuleService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const microservices_1 = require("@nestjs/microservices");
const typeorm_2 = require("typeorm");
const grpc_js_1 = require("@grpc/grpc-js");
const new_new_sku_dto_1 = require("../../dtos/new.new.sku.dto");
const common_service_1 = require("../common/common.service");
const path = __importStar(require("path"));
const cache_manager_1 = require("@nestjs/cache-manager");
const constants_1 = require("../../constants/constants");
let BusinessRuleService = class BusinessRuleService {
    pdmDataSource;
    pdmReaderDataSource;
    cacheManager;
    commonService;
    bussinessRuleService;
    attributeService;
    businessDataModelService;
    attributeClient;
    businessRuleClient;
    categoryClient;
    categoryService;
    constructor(pdmDataSource, pdmReaderDataSource, cacheManager, commonService) {
        this.pdmDataSource = pdmDataSource;
        this.pdmReaderDataSource = pdmReaderDataSource;
        this.cacheManager = cacheManager;
        this.commonService = commonService;
    }
    onModuleInit() {
        this.bussinessRuleService = this.businessRuleClient.getService('Rules');
        this.attributeService = this.attributeClient.getService('BusinessRule');
        this.businessDataModelService = this.attributeClient.getService('AttributeService');
        this.categoryService = this.categoryClient.getService('CategoryModifyService');
    }
    async getPricingRuleEvaluation(request, metaData) {
        const a = Date.now();
        let metadata = await this.addMetadata(metaData);
        let evaluatePricingRuleResponseObservable = await this.bussinessRuleService.EvaluatePricingRule(request, metadata);
        let response = await evaluatePricingRuleResponseObservable.toPromise();
        const dataArray = JSON.parse(response.data);
        return dataArray[0];
    }
    async getRuleForCategory(request, metaData) {
        try {
            let metadata = await this.addMetadata(metaData);
            let categoriesByPath = await this.categoryService.getTenantPathsFromAnyIds({ category_id: [request.id], lang_code: "en", get_all: true, only_leaf_ids: false }, metadata);
            let categoriesByPathResponse = await categoriesByPath.toPromise();
            categoriesByPathResponse.data = categoriesByPathResponse.data.filter(x => (x.value === request.id));
            let categories = categoriesByPathResponse.data[0].id_path.split(",").map(Number);
            request.id = categories;
            request.id.push(0);
            let rules = await this.attributeService.GetRuleForCategoryTwo(request, metadata);
            return await rules.toPromise();
        }
        catch (error) {
            console.log(`GRPC: getRuleForCategory Error:${error.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`);
            throw error;
        }
    }
    async getDependentTarget(request, metaData) {
        try {
            let metadata = await this.addMetadata(metaData);
            let categoriesByPath = await this.categoryService.getTenantPathsFromAnyIds({ category_id: [request.category_id], lang_code: "en", get_all: true, only_leaf_ids: false }, metadata);
            let categoriesByPathResponse = await categoriesByPath.toPromise();
            categoriesByPathResponse.data = categoriesByPathResponse.data.filter(x => (x.value === request.category_id));
            let categories = categoriesByPathResponse.data[0].id_path.split(",").map(Number);
            request.category_id = categories;
            request.category_id.push(0);
            let dependentAndTargetAttributes = await this.attributeService.getDependentTarget(request, metadata);
            return await dependentAndTargetAttributes.toPromise();
        }
        catch (error) {
            console.log(`GRPC: getDependentTarget Error:${error.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`);
            throw error;
        }
    }
    async getReferenceData(request, metaData) {
        try {
            const metadata = await this.addMetadata(metaData);
            let refData = await this.attributeService.getReferenceData(request, metadata);
            let referenceData = await refData.toPromise();
            return referenceData;
        }
        catch (error) {
            console.log(`GRPC: getReferenceData Error:${error.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`);
            throw error;
        }
    }
    async evaluateRuleGrpc(request, metaData) {
        try {
            const metadata = await this.addMetadata(metaData);
            const datavalue = await this.bussinessRuleService.EvaluateRule(request, metadata);
            return await datavalue.toPromise();
        }
        catch (error) {
            console.log(`GRPC: EvaluateRule Error:${error.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`);
            throw error;
        }
    }
    async getAttributesByCategory(categoryId, langCode, metaData) {
        try {
            const metadata = await this.addMetadata(metaData);
            const d = await this.businessDataModelService.getAttributesByCategory({ id: [categoryId], category_name: 'DummyCategory', lang_code: langCode, page: 1, limit: 9999999 }, metadata);
            return await d.toPromise();
        }
        catch (error) {
            console.log(`GRPC: getAttributesByCategory Error:${error.message} || Request: ${JSON.stringify({ id: [categoryId], category_name: 'DummyCategory', lang_code: langCode, page: 1, limit: 9999999 })} || Metadata:${JSON.stringify(metaData)}`);
            throw error;
        }
    }
    async rules(categoryId, pdmId, metaData, lang_code, target_only, rule_type, pricing, pdmInfo, channel_id, location_id, validationData, entityManager, fromSAP) {
        if (entityManager === undefined)
            entityManager = this.pdmDataSource.createEntityManager();
        try {
            const isLister = (channel_id != undefined && channel_id != null) ? 'lister_rules' : 'governance_rules';
            const rulesByCategory = await this.getRuleForCategory({ id: categoryId, type: rule_type, rule_type: isLister }, metaData);
            if (rulesByCategory.status == "error") {
                return this.responseObject(constants_1.ERROR, 'An unexpected error occurred on the server, please notify our team to resolve the issue', []);
            }
            if (rulesByCategory.data === undefined || rulesByCategory.data.length === 0 || rulesByCategory.data[0].target_attributes === undefined || rulesByCategory.data[0].target_attributes.length === 0) {
                return pdmInfo;
            }
            let rules = rulesByCategory.data;
            if (target_only == true) {
                for (let i = rules.length - 1; i >= 0; i--) {
                    if (rules[i].dependent_attributes && rules[i].dependent_attributes.length > 0) {
                        rules.splice(i, 1);
                    }
                }
            }
            for (let i = 0; i < rules.length; i++) {
                rules[i]['flag'] = false;
            }
            let dependentAndTargetAttributes = await this.getDependentTarget({ category_id: categoryId, type: rule_type, target_only: target_only, rule_type: isLister }, metaData);
            if (dependentAndTargetAttributes.status == "error") {
                return this.responseObject(constants_1.ERROR, 'An unexpected error occurred on the server, please notify our team to resolve the issue', []);
            }
            let target_attributes = dependentAndTargetAttributes.data.target_attributes;
            await this.evaluateRule(categoryId, pdmId, metaData, rules, lang_code, isLister, pdmInfo, channel_id, target_attributes, entityManager, pricing, validationData, fromSAP);
            return pdmInfo;
        }
        catch (error) {
            console.log(`InternalProcess: rules Error:${error.message} || Request:  || Metadata:${JSON.stringify(metaData)}`);
            throw error;
        }
    }
    async evaluateRule(categoryId, pdmId, metaData, rules, lang_code, rule_type, pdmInfo, channel_id, target_attributes, entityManager, pricing, validationData, fromSAP) {
        try {
            for (let i = 0; i < rules.length; i++) {
                if (rules[i].flag == false) {
                    await this.evaluateSingleRule(categoryId, pdmId, metaData, rules[i], lang_code, rule_type, pdmInfo, rules, channel_id, target_attributes, entityManager, pricing, validationData, fromSAP);
                }
            }
        }
        catch (error) {
            console.log(`InternalProcess: evaluateRules Error:${error.message} || Request:  || Metadata:${JSON.stringify(metaData)}`);
            throw error;
        }
    }
    async evaluateSingleRule(categoryId, pdmId, metaData, rule, lang_code, rule_type, pdmInfo, rules, channel_id, target_attributes, entityManager, pricing, validationData, fromSAP) {
        try {
            if (rule.dependent_attributes !== undefined && rule.dependent_attributes.length > 0) {
                for (let j = 0; j < rule.dependent_attributes.length; j++) {
                    if (rule_type == 'lister_rules' && rule.dependent_attributes[j] == rule.target_attributes[0]) {
                        if (rule.dependent_attributes[j] == rule.dependent_attributes[rule.dependent_attributes.length - 1]) {
                            await this.evaluation(categoryId, pdmId, metaData, rule, lang_code, rule_type, channel_id, pdmInfo, entityManager, pricing, validationData, fromSAP);
                            rule.flag = true;
                        }
                        continue;
                    }
                    if (target_attributes.includes(rule.dependent_attributes[j])) {
                        let cyclicalRule = await this.findRule(rule.dependent_attributes[j], rules);
                        await this.evaluateSingleRule(categoryId, pdmId, metaData, cyclicalRule, lang_code, rule_type, pdmInfo, rules, channel_id, target_attributes, entityManager, pricing, validationData, fromSAP);
                        if (rule.dependent_attributes[j] == rule.dependent_attributes[rule.dependent_attributes.length - 1]) {
                            await this.evaluation(categoryId, pdmId, metaData, rule, lang_code, rule_type, channel_id, pdmInfo, entityManager, pricing, validationData, fromSAP);
                            rule.flag = true;
                        }
                    }
                    else {
                        if (rule.dependent_attributes[j] == rule.dependent_attributes[rule.dependent_attributes.length - 1]) {
                            await this.evaluation(categoryId, pdmId, metaData, rule, lang_code, rule_type, channel_id, pdmInfo, entityManager, pricing, validationData, fromSAP);
                            rule.flag = true;
                        }
                    }
                }
            }
            else {
                await this.evaluation(categoryId, pdmId, metaData, rule, lang_code, rule_type, channel_id, pdmInfo, entityManager, pricing, validationData, fromSAP);
                rule.flag = true;
            }
        }
        catch (error) {
            console.log(`InternalProcess: evaluateSingleRule Error:${error.message} || Request:  || Metadata:${JSON.stringify(metaData)}`);
            throw error;
        }
    }
    async evaluation(categoryId, pdmId, metaData, rule, lang_code, rule_type, channel_id, pdmInfo, entityManager, pricing, validationData, fromSAP) {
        try {
            let evalRequest = await this.findFactData(rule, pdmInfo, lang_code, metaData, pricing, validationData);
            if (pricing) {
                for (let i = 0; i < pdmInfo.data.length; i++) {
                    if (pdmInfo.data[i].constraint == true) {
                        let referenceValues = await this.commonService.getReferenceValues(pdmInfo.data[i], lang_code, metaData);
                        pdmInfo.data[i].refrence_values = referenceValues;
                    }
                }
            }
            let flag = this.checkForAttrIsEmptyOrNot(rule, evalRequest.facts);
            for (let i = 0; i < evalRequest.facts.length; i++) {
                evalRequest.facts[i].value = JSON.stringify(evalRequest.facts[i].value);
            }
            if (flag)
                return await this.responseObject(constants_1.SUCCESS, 'Success', []);
            let savevalue = await this.evaluateRuleGrpc({ facts: evalRequest.facts,
                ruleId: evalRequest.ruleId,
                ruleOperationType: evalRequest.ruleOperationType,
                lang_code: evalRequest.lang_code,
                channelId: channel_id,
                category_id: categoryId,
                pdm_id: pdmId }, metaData);
            if (savevalue.status == 'success') {
                if (rule.operation_type == 'mandatoryrules' || rule.operation_type == 'rangerules') {
                    return savevalue;
                }
                else if (rule.operation_type == 'independentfilterrules' || rule.operation_type == 'dependentfilterrules') {
                    let evaluatedFilter = await this.parsePdmInfo(categoryId, pdmId, rule.operation_type, savevalue, false, pdmInfo, pricing, metaData);
                    return evaluatedFilter;
                }
                else {
                    await this.parsePdmInfo(categoryId, pdmId, rule.operation_type, savevalue.data[0], false, pdmInfo, pricing, metaData, evalRequest.ruleId);
                    let isLister = channel_id != undefined ? 'lister_rules' : 'governance_rules';
                    await this.saveEvaluatedData(categoryId, pdmId, metaData, savevalue.data[0].values, isLister, entityManager, fromSAP);
                }
            }
            else {
                if (rule.operation_type == 'mandatoryrules' || rule.operation_type == 'rangerules') {
                    throw new common_1.HttpException(savevalue.message, 409);
                }
            }
        }
        catch (error) {
            console.log(`InternalProcess: evaluation Error:${error.message} || Request:  || Metadata:${JSON.stringify(metaData)}`);
            throw error;
        }
    }
    async saveEvaluatedData(categoryId, pdmId, metaData, values, rule_type, entityManager, fromSAP) {
        try {
            const updateObject = {};
            for (let value of values) {
                if (value.value === '' || value.value === undefined) {
                    updateObject[value.targetAttribute] = null;
                }
                else {
                    updateObject[value.targetAttribute] = value.value;
                }
            }
            if (rule_type !== 'lister_rules') {
                const skuCode = await this.pdmReaderDataSource.manager.query(`SELECT code FROM default_product_attributes WHERE pdm_id = $1 AND category_id = $2 AND tenant_id = $3 AND org_id = $4`, [pdmId, categoryId, metaData.tenant_id, metaData.org_id]);
            }
        }
        catch (error) {
            console.log(`InternalProcess: saveEvaluatedData Error:${error.message} || Request:  || Metadata:${JSON.stringify(metaData)}`);
            throw error;
        }
    }
    async saveFalseData(message, entityManager) {
        try {
            const values = await entityManager.query(`select * from pdm_in0001_or0001_1 where pdm_id='fghg'`);
            return values;
        }
        catch (err) {
            throw new common_1.HttpException(message, 400);
        }
    }
    async findRule(attribute, rules) {
        try {
            for (let i = 0; i < rules.length; i++) {
                for (let j = 0; j < rules[i].target_attributes.length; j++) {
                    if (rules[i].target_attributes[j] == attribute) {
                        return rules[i];
                    }
                }
            }
        }
        catch (error) {
            console.log(`InternalProcess: findRule Error:${error.message} || Request:  ||`);
            throw error;
        }
    }
    checkForAttrIsEmptyOrNot(rule, facts) {
        try {
            if (rule.dependent_attributes != undefined || rule.dependent_attributes != null) {
                for (let i = 0; i < rule.dependent_attributes.length; i++) {
                    let flag = true;
                    for (let j = 0; j < facts.length; j++) {
                        if (rule.dependent_attributes[i] === facts[j].attributeName) {
                            flag = false;
                            if (facts[j].value.value === null || facts[j].value.value === undefined || facts[j].value.value === 'Select' || facts[j].value.value === "") {
                                return true;
                            }
                        }
                    }
                    if (flag) {
                        return true;
                    }
                }
            }
            return false;
        }
        catch (error) {
            console.log(`InternalProcess: checkForAttrIsEmptyOrNot Error:${error.message} `);
            throw error;
        }
    }
    async parsePdmInfo(category_id, pdm_id, rule_type, completesavevalue, ruleResult, pdmInfo, pricing, user, ruleId) {
        try {
            let savevalue = completesavevalue;
            if (pricing) {
                switch (rule_type) {
                    case "defaultrules":
                        savevalue = completesavevalue["values"];
                        for (let i = 0; i < pdmInfo.data.length; i++) {
                            if (pdmInfo.data[i].attribute_type == "multiSelectDropdown" && pdmInfo.data[i].attribute_db_name == completesavevalue["targetAttribute"]) {
                                pdmInfo.data[i].attribute_value = completesavevalue["multiselectSetValues"];
                                (pdmInfo.data[i])["attr_block"] = true;
                            }
                            else {
                                if (savevalue != undefined) {
                                    for (let l = 0; l < savevalue.length; l++) {
                                        if (pdmInfo.data[i].attribute_db_name == savevalue[l].targetAttribute) {
                                            if (pdmInfo.data[i].constraint == true) {
                                                for (let n = 0; n < pdmInfo.data[i].old_reference_values.length; n++) {
                                                    if (savevalue[l].value == pdmInfo.data[i].old_reference_values[n].id) {
                                                        if (pdmInfo.data[i].attribute_type === 'multiSelectDropdown') {
                                                            (pdmInfo.data[i])["attribute_value"] = completesavevalue["multiselectSetValues"];
                                                        }
                                                        else {
                                                            (pdmInfo.data[i])["attribute_value"] = String(pdmInfo.data[i].old_reference_values[n].id);
                                                            (pdmInfo.data[i])["attr_block"] = true;
                                                        }
                                                    }
                                                }
                                            }
                                            else {
                                                (pdmInfo.data[i])["attribute_value"] = savevalue[l].value;
                                                (pdmInfo.data[i])["attr_block"] = true;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        break;
                    case "mandatoryrules":
                        break;
                    case "concatenationrules":
                        savevalue = completesavevalue["values"];
                        for (let i = 0; i < pdmInfo.data.length; i++) {
                            for (let l = 0; l < savevalue.length; l++) {
                                if (pdmInfo.data[i].attribute_db_name == savevalue[l].targetAttribute) {
                                    (pdmInfo.data[i])["attribute_value"] = savevalue[l].value;
                                    (pdmInfo.data[i])["attr_block"] = true;
                                }
                            }
                        }
                        break;
                    case "sequencerules":
                        let redisKey = `pim_` + String(category_id) + `_` + String(pdm_id) + `_${ruleId}_${user.tenant_id}_${user.org_id}`;
                        let val = await this.cacheManager.get(redisKey);
                        if (val === undefined || val === '' || val === null) {
                            for (let i = 0; i < pdmInfo.data.length; i++) {
                                for (let l = 0; l < savevalue.length; l++) {
                                    if (pdmInfo.data[i].attribute_db_name == savevalue[l].targetAttribute) {
                                        (pdmInfo.data[i])["attribute_value"] = savevalue[l].value;
                                        (pdmInfo.data[i])["attr_block"] = true;
                                    }
                                }
                            }
                        }
                        break;
                    case "rangerules":
                        break;
                    case "independentfilterrules":
                        for (let i = 0; i < pdmInfo.attribute_groups.length; i++) {
                            if (pdmInfo.attribute_groups[i].attributes) {
                                for (let j = 0; j < pdmInfo.attribute_groups[i].attributes.length; j++) {
                                    for (let l = 0; l < savevalue.data.length; l++) {
                                        if (pdmInfo.attribute_groups[i].attributes[j].attribute_db_name == savevalue.data[l].targetAttribute) {
                                            (pdmInfo.attribute_groups[i].attributes[j])["refrence_values"] = [];
                                            if ((pdmInfo.attribute_groups[i].attributes[j]).attribute_type != "multiSelectDropdown") {
                                                ((pdmInfo.attribute_groups[i].attributes[j])["refrence_values"]).push({ "id": 0, "value": "Select" });
                                            }
                                            (pdmInfo.attribute_groups[i].attributes[j])["attr_block"] = false;
                                            for (let k = 0; k < savevalue.data[l].data_to_filter.length; k++) {
                                                ((pdmInfo.attribute_groups[i].attributes[j])["refrence_values"]).push({
                                                    id: savevalue.data[l].data_to_filter[k].id,
                                                    value: savevalue.data[l].data_to_filter[k].value,
                                                    status: savevalue.data[l].data_to_filter[k].status
                                                });
                                            }
                                            let checkForConflictValue = false;
                                            if ((pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] != null || (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] != undefined) {
                                                for (let a = 0; a < (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"].length; a++) {
                                                    let tempflag = true;
                                                    for (let b = 0; b < (pdmInfo.attribute_groups[i].attributes[j])["refrence_values"].length; b++) {
                                                        if ((pdmInfo.attribute_groups[i].attributes[j])["attribute_value"][a].id == (pdmInfo.attribute_groups[i].attributes[j])["refrence_values"][b].id) {
                                                            tempflag = false;
                                                            break;
                                                        }
                                                    }
                                                    if (tempflag) {
                                                        (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] = [];
                                                        break;
                                                    }
                                                }
                                            }
                                            (pdmInfo.attribute_groups[i].attributes[j])["rule_id"] = "filter";
                                        }
                                    }
                                }
                            }
                        }
                        break;
                    case "dependentfilterrules":
                        for (let i = 0; i < pdmInfo.attribute_groups.length; i++) {
                            if (pdmInfo.attribute_groups[i].attributes) {
                                for (let j = 0; j < pdmInfo.attribute_groups[i].attributes.length; j++) {
                                    let filterIds = [];
                                    for (let l = 0; l < savevalue.data.length; l++) {
                                        if (pdmInfo.attribute_groups[i].attributes[j].attribute_db_name == savevalue.data[l].targetAttribute) {
                                            (pdmInfo.attribute_groups[i].attributes[j])["refrence_values"] = [];
                                            if ((pdmInfo.attribute_groups[i].attributes[j]).attribute_type != "multiSelectDropdown") {
                                                ((pdmInfo.attribute_groups[i].attributes[j])["refrence_values"]).push({ "id": 0, "value": "Select" });
                                            }
                                            for (let k = 0; k < savevalue.data[l].data_to_filter.length; k++) {
                                                ((pdmInfo.attribute_groups[i].attributes[j])["refrence_values"]).push({
                                                    id: savevalue.data[l].data_to_filter[k].id,
                                                    value: savevalue.data[l].data_to_filter[k].value,
                                                    status: savevalue.data[l].data_to_filter[k].status
                                                });
                                                filterIds.push(savevalue.data[l].data_to_filter[k].id);
                                            }
                                            if ((pdmInfo.attribute_groups[i].attributes[j])['attribute_value'] != null || (pdmInfo.attribute_groups[i].attributes[j])['attribute_value'] != undefined) {
                                                for (let p = 0; p < (pdmInfo.attribute_groups[i].attributes[j])['attribute_value'].length; p++) {
                                                    let curr = (pdmInfo.attribute_groups[i].attributes[j])['attribute_value'][p].id;
                                                    if (!filterIds.includes(curr)) {
                                                        (pdmInfo.attribute_groups[i].attributes[j])['attribute_value'] = [];
                                                        return;
                                                    }
                                                }
                                            }
                                            (pdmInfo.attribute_groups[i].attributes[j])["rule_id"] = "filter";
                                        }
                                    }
                                }
                            }
                        }
                        break;
                }
            }
            else {
                if (pdmInfo?.attribute_groups != undefined) {
                    switch (rule_type) {
                        case "defaultrules":
                            savevalue = completesavevalue["values"];
                            for (let i = 0; i < pdmInfo.attribute_groups.length; i++) {
                                if (pdmInfo.attribute_groups[i].attributes) {
                                    for (let j = 0; j < pdmInfo.attribute_groups[i].attributes.length; j++) {
                                        if (pdmInfo.attribute_groups[i].attributes[j].attribute_type == "multiSelectDropdown" && pdmInfo.attribute_groups[i].attributes[j].attribute_db_name == completesavevalue["targetAttribute"]) {
                                            pdmInfo.attribute_groups[i].attributes[j].attribute_value = completesavevalue["multiselectSetValues"];
                                            (pdmInfo.attribute_groups[i].attributes[j])["attr_block"] = true;
                                        }
                                        else {
                                            if (savevalue != undefined) {
                                                for (let l = 0; l < savevalue.length; l++) {
                                                    if (pdmInfo.attribute_groups[i].attributes[j].attribute_db_name == savevalue[l].targetAttribute) {
                                                        if (pdmInfo.attribute_groups[i].attributes[j].constraint == true) {
                                                            for (let n = 0; n < pdmInfo.attribute_groups[i].attributes[j].old_reference_values.length; n++) {
                                                                if (savevalue[l].value == pdmInfo.attribute_groups[i].attributes[j].old_reference_values[n].id) {
                                                                    if (pdmInfo.attribute_groups[i].attributes[j].attribute_type === 'multiSelectDropdown') {
                                                                        (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] = completesavevalue["multiselectSetValues"];
                                                                    }
                                                                    else {
                                                                        (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] = String(pdmInfo.attribute_groups[i].attributes[j].old_reference_values[n].id);
                                                                        (pdmInfo.attribute_groups[i].attributes[j])["attr_block"] = true;
                                                                    }
                                                                }
                                                            }
                                                        }
                                                        else {
                                                            (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] = savevalue[l].value;
                                                            (pdmInfo.attribute_groups[i].attributes[j])["attr_block"] = true;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            break;
                        case "mandatoryrules":
                            break;
                        case "concatenationrules":
                            savevalue = completesavevalue["values"];
                            for (let i = 0; i < pdmInfo.attribute_groups.length; i++) {
                                if (pdmInfo.attribute_groups[i].attributes) {
                                    for (let j = 0; j < pdmInfo.attribute_groups[i].attributes.length; j++) {
                                        for (let l = 0; l < savevalue.length; l++) {
                                            if (pdmInfo.attribute_groups[i].attributes[j].attribute_db_name == savevalue[l].targetAttribute) {
                                                (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] = savevalue[l].value;
                                                (pdmInfo.attribute_groups[i].attributes[j])["attr_block"] = true;
                                            }
                                        }
                                    }
                                }
                            }
                            break;
                        case "sequencerules":
                            savevalue = completesavevalue["values"];
                            for (let i = 0; i < pdmInfo.attribute_groups.length; i++) {
                                if (pdmInfo.attribute_groups[i].attributes) {
                                    for (let j = 0; j < pdmInfo.attribute_groups[i].attributes.length; j++) {
                                        for (let l = 0; l < savevalue.length; l++) {
                                            if (pdmInfo.attribute_groups[i].attributes[j].attribute_db_name == savevalue[l].targetAttribute) {
                                                (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] = (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] ?? savevalue[l].value;
                                                (pdmInfo.attribute_groups[i].attributes[j])["attr_block"] = true;
                                            }
                                        }
                                    }
                                }
                            }
                            break;
                        case "rangerules":
                            break;
                        case "independentfilterrules":
                            for (let i = 0; i < pdmInfo.attribute_groups.length; i++) {
                                if (pdmInfo.attribute_groups[i].attributes) {
                                    for (let j = 0; j < pdmInfo.attribute_groups[i].attributes.length; j++) {
                                        for (let l = 0; l < savevalue.data.length; l++) {
                                            if (pdmInfo.attribute_groups[i].attributes[j].attribute_db_name == savevalue.data[l].targetAttribute) {
                                                (pdmInfo.attribute_groups[i].attributes[j])["refrence_values"] = [];
                                                if ((pdmInfo.attribute_groups[i].attributes[j]).attribute_type != "multiSelectDropdown") {
                                                    ((pdmInfo.attribute_groups[i].attributes[j])["refrence_values"]).push({ "id": 0, "value": "Select" });
                                                }
                                                (pdmInfo.attribute_groups[i].attributes[j])["attr_block"] = false;
                                                for (let k = 0; k < savevalue.data[l].data_to_filter.length; k++) {
                                                    ((pdmInfo.attribute_groups[i].attributes[j])["refrence_values"]).push({
                                                        id: savevalue.data[l].data_to_filter[k].id,
                                                        value: savevalue.data[l].data_to_filter[k].value,
                                                        status: savevalue.data[l].data_to_filter[k].status
                                                    });
                                                }
                                                let checkForConflictValue = false;
                                                if ((pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] != null || (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] != undefined) {
                                                    for (let a = 0; a < (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"].length; a++) {
                                                        let tempflag = true;
                                                        for (let b = 0; b < (pdmInfo.attribute_groups[i].attributes[j])["refrence_values"].length; b++) {
                                                            if ((pdmInfo.attribute_groups[i].attributes[j])["attribute_value"][a].id == (pdmInfo.attribute_groups[i].attributes[j])["refrence_values"][b].id) {
                                                                tempflag = false;
                                                                break;
                                                            }
                                                        }
                                                        if (tempflag) {
                                                            (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] = [];
                                                            break;
                                                        }
                                                    }
                                                }
                                                (pdmInfo.attribute_groups[i].attributes[j])["rule_id"] = "filter";
                                            }
                                        }
                                    }
                                }
                            }
                            break;
                        case "dependentfilterrules":
                            for (let i = 0; i < pdmInfo.attribute_groups.length; i++) {
                                if (pdmInfo.attribute_groups[i].attributes) {
                                    for (let j = 0; j < pdmInfo.attribute_groups[i].attributes.length; j++) {
                                        let filterIds = [];
                                        for (let l = 0; l < savevalue.data.length; l++) {
                                            if (pdmInfo.attribute_groups[i].attributes[j].attribute_db_name == savevalue.data[l].targetAttribute) {
                                                (pdmInfo.attribute_groups[i].attributes[j])["refrence_values"] = [];
                                                if ((pdmInfo.attribute_groups[i].attributes[j]).attribute_type != "multiSelectDropdown") {
                                                    ((pdmInfo.attribute_groups[i].attributes[j])["refrence_values"]).push({ "id": 0, "value": "Select" });
                                                }
                                                for (let k = 0; k < savevalue.data[l].data_to_filter.length; k++) {
                                                    ((pdmInfo.attribute_groups[i].attributes[j])["refrence_values"]).push({
                                                        id: savevalue.data[l].data_to_filter[k].id,
                                                        value: savevalue.data[l].data_to_filter[k].value,
                                                        status: savevalue.data[l].data_to_filter[k].status
                                                    });
                                                    filterIds.push(savevalue.data[l].data_to_filter[k].id);
                                                }
                                                if ((pdmInfo.attribute_groups[i].attributes[j])['attribute_value'] != null || (pdmInfo.attribute_groups[i].attributes[j])['attribute_value'] != undefined) {
                                                    for (let p = 0; p < (pdmInfo.attribute_groups[i].attributes[j])['attribute_value'].length; p++) {
                                                        let curr = (pdmInfo.attribute_groups[i].attributes[j])['attribute_value'][p].id;
                                                        if (!filterIds.includes(curr)) {
                                                            (pdmInfo.attribute_groups[i].attributes[j])['attribute_value'] = [];
                                                            return;
                                                        }
                                                    }
                                                }
                                                (pdmInfo.attribute_groups[i].attributes[j])["rule_id"] = "filter";
                                            }
                                        }
                                    }
                                }
                            }
                            break;
                    }
                }
            }
        }
        catch (error) {
            console.log(`InternalProcess: parsePdmInfo Error:${error.message} || Request:  || Metadata: `);
            throw error;
        }
    }
    async findFactData2(rule, pdmInfo, lang_code, MetaData) {
        let factRequest = new new_new_sku_dto_1.evalDto();
        factRequest.facts = [];
        factRequest.ruleOperationType = rule.operation_type;
        factRequest.ruleId = rule.id;
        factRequest.lang_code = lang_code;
        if (rule.dependent_attributes !== undefined) {
            if (rule.operation_type == 'mandatoryrules' || rule.operation_type == 'rangerules') {
                for (let i = 0; i < rule.target_attributes.length; i++) {
                    for (let j = 0; j < pdmInfo.attribute_groups.length; j++) {
                        if (pdmInfo.attribute_groups[j].attributes) {
                            for (let k = 0; k < pdmInfo.attribute_groups[j].attributes.length; k++) {
                                if (rule.target_attributes[i] == pdmInfo.attribute_groups[j].attributes[k].attribute_db_name) {
                                    if (pdmInfo.attribute_groups[j].attributes[k].attribute_value == null) {
                                        let facts = new new_new_sku_dto_1.fact();
                                        facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                        facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                        facts.value = '';
                                        factRequest.facts.push(facts);
                                    }
                                    else {
                                        if (pdmInfo.attribute_groups[j].attributes[k].constraint == true) {
                                            for (let m = 0; m < pdmInfo.attribute_groups[j].attributes[k].refrence_values.length; m++) {
                                                if (parseInt(pdmInfo.attribute_groups[j].attributes[k].attribute_value) == pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].id) {
                                                    pdmInfo.attribute_groups[j].attributes[k].attribute_value = pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].id;
                                                }
                                            }
                                        }
                                        else {
                                            let facts = new new_new_sku_dto_1.fact();
                                            facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                            facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                            facts.value = pdmInfo.attribute_groups[j].attributes[k].attribute_value;
                                            factRequest.facts.push(facts);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            for (let i = 0; i < rule.dependent_attributes.length; i++) {
                for (let j = 0; j < pdmInfo.attribute_groups.length; j++) {
                    if (pdmInfo.attribute_groups[j].attributes) {
                        for (let k = 0; k < pdmInfo.attribute_groups[j].attributes.length; k++) {
                            if (rule.dependent_attributes[i] == pdmInfo.attribute_groups[j].attributes[k].attribute_db_name) {
                                if (pdmInfo.attribute_groups[j].attributes[k].attribute_value == null) {
                                    let facts = new new_new_sku_dto_1.fact();
                                    facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                    facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                    facts.value = '';
                                    factRequest.facts.push(facts);
                                }
                                else {
                                    if (pdmInfo.attribute_groups[j].attributes[k].constraint == true) {
                                        if (pdmInfo.attribute_groups[j].attributes[k].attribute_type == "multiSelectDropdown") {
                                            let factt = new new_new_sku_dto_1.fact();
                                            factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                            factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                            factt.value = pdmInfo.attribute_groups[j].attributes[k].attribute_value;
                                            factRequest.facts.push(factt);
                                        }
                                        else {
                                            let flag = true;
                                            for (let m = 0; m < pdmInfo.attribute_groups[j].attributes[k].refrence_values.length; m++) {
                                                if (parseInt(pdmInfo.attribute_groups[j].attributes[k].attribute_value) == pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].id) {
                                                    flag = false;
                                                    pdmInfo.attribute_groups[j].attributes[k].attribute_value = pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].id;
                                                    let factt = new new_new_sku_dto_1.fact();
                                                    factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                                    factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                                    factt.value = pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].value;
                                                    factRequest.facts.push(factt);
                                                }
                                                else if ((pdmInfo.attribute_groups[j].attributes[k].attribute_value) == pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].value) {
                                                    flag = false;
                                                    let factt = new new_new_sku_dto_1.fact();
                                                    factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                                    factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                                    factt.value = pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].value;
                                                    factRequest.facts.push(factt);
                                                }
                                            }
                                            if (flag) {
                                                let factt = new new_new_sku_dto_1.fact();
                                                factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                                factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                                factt.value = "";
                                                factRequest.facts.push(factt);
                                            }
                                        }
                                    }
                                    else {
                                        let facts = new new_new_sku_dto_1.fact();
                                        facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                        facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                        facts.value = pdmInfo.attribute_groups[j].attributes[k].attribute_value;
                                        factRequest.facts.push(facts);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return factRequest;
    }
    async findFactData(rule, pdmInfo, lang_code, MetaData, pricing, validationData) {
        try {
            let factRequest = new new_new_sku_dto_1.evalDto();
            factRequest.facts = [];
            factRequest.ruleOperationType = rule.operation_type;
            factRequest.ruleId = rule.id;
            factRequest.lang_code = lang_code;
            if (pricing) {
                if (rule.operation_type == 'mandatoryrules' || rule.operation_type == 'rangerules') {
                    if (rule.operation_type == 'mandatoryrules' || rule.operation_type == 'rangerules') {
                        for (let i = 0; i < rule.target_attributes.length; i++) {
                            for (let j = 0; j < pdmInfo.data.length; j++) {
                                if (rule.target_attributes[i] == pdmInfo.data[j].attribute_db_name) {
                                    for (let l = 0; l < validationData.length; l++) {
                                        if (validationData[l].attribute_db_name == rule.target_attributes[i]) {
                                            if (validationData[l].attribute_value == null) {
                                                let facts = new new_new_sku_dto_1.fact();
                                                facts.attributeName = pdmInfo.data[j].attribute_db_name;
                                                facts.attributeType = pdmInfo.data[j].attribute_data_type;
                                                facts.value = { value: '' };
                                                factRequest.facts.push(facts);
                                            }
                                            else {
                                                if (pdmInfo.data[j].constraint == true) {
                                                    let facts = new new_new_sku_dto_1.fact();
                                                    facts.attributeName = pdmInfo.data[j].attribute_db_name;
                                                    facts.attributeType = pdmInfo.data[j].attribute_data_type;
                                                    facts.value = ({ value: validationData[l].attribute_value });
                                                    factRequest.facts.push(facts);
                                                }
                                                else {
                                                    let facts = new new_new_sku_dto_1.fact();
                                                    facts.attributeName = pdmInfo.data[j].attribute_db_name;
                                                    facts.attributeType = pdmInfo.data[j].attribute_data_type;
                                                    facts.value = ({ value: validationData[l].attribute_value });
                                                    factRequest.facts.push(facts);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (rule.dependent_attributes !== undefined) {
                        for (let i = 0; i < rule.dependent_attributes.length; i++) {
                            for (let j = 0; j < pdmInfo.data.length; j++) {
                                if (rule.dependent_attributes[i] == pdmInfo.data[j].attribute_db_name) {
                                    if (validationData.attribute_value == null) {
                                        let facts = new new_new_sku_dto_1.fact();
                                        facts.attributeName = pdmInfo.data[j].attribute_db_name;
                                        facts.attributeType = pdmInfo.data[j].attribute_data_type;
                                        facts.value = ({ value: '' });
                                        factRequest.facts.push(facts);
                                    }
                                    else {
                                        if (pdmInfo.data[j].constraint == true) {
                                            if (pdmInfo.data[j].attribute_type == "multiSelectDropdown") {
                                                let factt = new new_new_sku_dto_1.fact();
                                                factt.attributeName = pdmInfo.data[j].attribute_db_name;
                                                factt.attributeType = pdmInfo.data[j].attribute_data_type;
                                                factt.value = ({ value: validationData.attribute_value });
                                                factRequest.facts.push(factt);
                                            }
                                            else {
                                                let factt = new new_new_sku_dto_1.fact();
                                                factt.attributeName = pdmInfo.data[j].attribute_db_name;
                                                factt.attributeType = pdmInfo.data[j].attribute_data_type;
                                                factt.value = ({ value: validationData.attribute_value });
                                                factRequest.facts.push(factt);
                                            }
                                        }
                                        else {
                                            let facts = new new_new_sku_dto_1.fact();
                                            facts.attributeName = pdmInfo.data[j].attribute_db_name;
                                            facts.attributeType = pdmInfo.data[j].attribute_data_type;
                                            facts.value = ({ value: pdmInfo.data[j].attribute_value });
                                            factRequest.facts.push(facts);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    if (rule.dependent_attributes !== undefined) {
                        for (let i = 0; i < rule.dependent_attributes.length; i++) {
                            for (let j = 0; j < pdmInfo.data.length; j++) {
                                if (rule.dependent_attributes[i] == pdmInfo.data[j].attribute_db_name) {
                                    if (pdmInfo.data[j].attribute_value == null) {
                                        let facts = new new_new_sku_dto_1.fact();
                                        facts.attributeName = pdmInfo.data[j].attribute_db_name;
                                        facts.attributeType = pdmInfo.data[j].attribute_data_type;
                                        facts.value = ({ value: '' });
                                        factRequest.facts.push(facts);
                                    }
                                    else {
                                        if (pdmInfo.data[j].constraint == true) {
                                            if (pdmInfo.data[j].attribute_type == "multiSelectDropdown") {
                                                let factt = new new_new_sku_dto_1.fact();
                                                factt.attributeName = pdmInfo.data[j].attribute_db_name;
                                                factt.attributeType = pdmInfo.data[j].attribute_data_type;
                                                factt.value = ({ value: pdmInfo.data[j].attribute_value });
                                                factRequest.facts.push(factt);
                                            }
                                            else {
                                                let flag = true;
                                                for (let m = 0; m < pdmInfo.data[j].refrence_values.length; m++) {
                                                    if (parseInt(pdmInfo.data[j].attribute_value) == pdmInfo.data[j].refrence_values[m].id) {
                                                        flag = false;
                                                        let factt = new new_new_sku_dto_1.fact();
                                                        factt.attributeName = pdmInfo.data[j].attribute_db_name;
                                                        factt.attributeType = pdmInfo.data[j].attribute_data_type;
                                                        factt.value = ({ value: pdmInfo.data[j].refrence_values[m].value });
                                                        factRequest.facts.push(factt);
                                                    }
                                                    else if ((pdmInfo.data[j].attribute_value) == pdmInfo.data[j].refrence_values[m].value) {
                                                        flag = false;
                                                        let factt = new new_new_sku_dto_1.fact();
                                                        factt.attributeName = pdmInfo.data[j].attribute_db_name;
                                                        factt.attributeType = pdmInfo.data[j].attribute_data_type;
                                                        factt.value = ({ value: pdmInfo.data[j].refrence_values[m].value });
                                                        factRequest.facts.push(factt);
                                                    }
                                                }
                                                if (flag) {
                                                    let factt = new new_new_sku_dto_1.fact();
                                                    factt.attributeName = pdmInfo.data[j].attribute_db_name;
                                                    factt.attributeType = pdmInfo.data[j].attribute_data_type;
                                                    factt.value = ({ value: "" });
                                                    factRequest.facts.push(factt);
                                                }
                                            }
                                        }
                                        else {
                                            let facts = new new_new_sku_dto_1.fact();
                                            facts.attributeName = pdmInfo.data[j].attribute_db_name;
                                            facts.attributeType = pdmInfo.data[j].attribute_data_type;
                                            facts.value = ({ value: pdmInfo.data[j].attribute_value });
                                            factRequest.facts.push(facts);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else {
                if (rule.operation_type == 'mandatoryrules' || rule.operation_type == 'rangerules') {
                    if (rule.operation_type == 'mandatoryrules' || rule.operation_type == 'rangerules') {
                        for (let i = 0; i < rule.target_attributes.length; i++) {
                            for (let j = 0; j < pdmInfo.attribute_groups.length; j++) {
                                if (pdmInfo.attribute_groups[j].attributes) {
                                    for (let k = 0; k < pdmInfo.attribute_groups[j].attributes.length; k++) {
                                        if (rule.target_attributes[i] == pdmInfo.attribute_groups[j].attributes[k].attribute_db_name) {
                                            for (let l = 0; l < validationData.length; l++) {
                                                if (validationData[l].attribute_db_name == rule.target_attributes[i]) {
                                                    if (validationData[l].attribute_value == null) {
                                                        let facts = new new_new_sku_dto_1.fact();
                                                        facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                                        facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                                        facts.value = { value: '' };
                                                        factRequest.facts.push(facts);
                                                    }
                                                    else {
                                                        if (pdmInfo.attribute_groups[j].attributes[k].constraint == true) {
                                                            let facts = new new_new_sku_dto_1.fact();
                                                            facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                                            facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                                            facts.value = ({ value: validationData[l].attribute_value });
                                                            factRequest.facts.push(facts);
                                                        }
                                                        else {
                                                            let facts = new new_new_sku_dto_1.fact();
                                                            facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                                            facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                                            facts.value = ({ value: validationData[l].attribute_value });
                                                            factRequest.facts.push(facts);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (rule.dependent_attributes !== undefined) {
                        for (let i = 0; i < rule.dependent_attributes.length; i++) {
                            for (let j = 0; j < pdmInfo.attribute_groups.length; j++) {
                                if (pdmInfo.attribute_groups[j].attributes) {
                                    for (let k = 0; k < pdmInfo.attribute_groups[j].attributes.length; k++) {
                                        if (rule.dependent_attributes[i] == pdmInfo.attribute_groups[j].attributes[k].attribute_db_name) {
                                            if (validationData.attribute_value == null) {
                                                let facts = new new_new_sku_dto_1.fact();
                                                facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                                facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                                facts.value = ({ value: '' });
                                                factRequest.facts.push(facts);
                                            }
                                            else {
                                                if (pdmInfo.attribute_groups[j].attributes[k].constraint == true) {
                                                    if (pdmInfo.attribute_groups[j].attributes[k].attribute_type == "multiSelectDropdown") {
                                                        let factt = new new_new_sku_dto_1.fact();
                                                        factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                                        factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                                        factt.value = ({ value: validationData.attribute_value });
                                                        factRequest.facts.push(factt);
                                                    }
                                                    else {
                                                        let factt = new new_new_sku_dto_1.fact();
                                                        factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                                        factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                                        factt.value = ({ value: validationData.attribute_value });
                                                        factRequest.facts.push(factt);
                                                    }
                                                }
                                                else {
                                                    let facts = new new_new_sku_dto_1.fact();
                                                    facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                                    facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                                    facts.value = ({ value: pdmInfo.attribute_groups[j].attributes[k].attribute_value });
                                                    factRequest.facts.push(facts);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    if (rule.dependent_attributes !== undefined) {
                        for (let i = 0; i < rule.dependent_attributes.length; i++) {
                            for (let j = 0; j < pdmInfo.attribute_groups.length; j++) {
                                if (pdmInfo.attribute_groups[j].attributes) {
                                    for (let k = 0; k < pdmInfo.attribute_groups[j].attributes.length; k++) {
                                        if (rule.dependent_attributes[i] == pdmInfo.attribute_groups[j].attributes[k].attribute_db_name) {
                                            if (pdmInfo.attribute_groups[j].attributes[k].attribute_value == null) {
                                                let facts = new new_new_sku_dto_1.fact();
                                                facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                                facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                                facts.value = ({ value: '' });
                                                factRequest.facts.push(facts);
                                            }
                                            else {
                                                if (pdmInfo.attribute_groups[j].attributes[k].constraint == true) {
                                                    if (pdmInfo.attribute_groups[j].attributes[k].attribute_type == "multiSelectDropdown") {
                                                        let factt = new new_new_sku_dto_1.fact();
                                                        factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                                        factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                                        factt.value = ({ value: pdmInfo.attribute_groups[j].attributes[k].attribute_value });
                                                        factRequest.facts.push(factt);
                                                    }
                                                    else {
                                                        let flag = true;
                                                        for (let m = 0; m < pdmInfo.attribute_groups[j].attributes[k].refrence_values.length; m++) {
                                                            if (parseInt(pdmInfo.attribute_groups[j].attributes[k].attribute_value) == pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].id) {
                                                                flag = false;
                                                                let factt = new new_new_sku_dto_1.fact();
                                                                factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                                                factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                                                factt.value = ({ value: pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].value });
                                                                factRequest.facts.push(factt);
                                                            }
                                                            else if ((pdmInfo.attribute_groups[j].attributes[k].attribute_value) == pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].value) {
                                                                flag = false;
                                                                let factt = new new_new_sku_dto_1.fact();
                                                                factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                                                factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                                                factt.value = ({ value: pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].value });
                                                                factRequest.facts.push(factt);
                                                            }
                                                        }
                                                        if (flag) {
                                                            let factt = new new_new_sku_dto_1.fact();
                                                            factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                                            factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                                            factt.value = ({ value: "" });
                                                            factRequest.facts.push(factt);
                                                        }
                                                    }
                                                }
                                                else {
                                                    let facts = new new_new_sku_dto_1.fact();
                                                    facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                                    facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                                    facts.value = ({ value: pdmInfo.attribute_groups[j].attributes[k].attribute_value });
                                                    factRequest.facts.push(facts);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return factRequest;
        }
        catch (error) {
        }
    }
    async addMetadata(metaData) {
        const metadata = new grpc_js_1.Metadata();
        metadata.add('tenant_id', metaData.tenant_id);
        metadata.add('user_id', metaData.user_id);
        metadata.add('org_id', metaData.org_id);
        return metadata;
    }
    async responseObject(status, message, data) {
        return {
            status: status,
            message: message,
            data: data
        };
    }
    async getcolumnvalue(categoryId, pdmId, metaData) {
        const tableName = `product_data`;
        const a = await this.pdmReaderDataSource.manager.query(`SELECT
        column_name,data_type
        FROM
        information_schema.columns
        WHERE
        table_name = $1`, [tableName]);
        const values = await this.pdmReaderDataSource.manager.query(`select * from ${tableName} where pdm_id=$1`, [pdmId]);
        for (let x of a) {
            x['value'] = values[0][`${x.column_name}`];
        }
        return a;
    }
};
exports.BusinessRuleService = BusinessRuleService;
__decorate([
    (0, microservices_1.Client)({
        transport: microservices_1.Transport.GRPC,
        options: {
            channelOptions: {
                'grpc.service_config': `{
                            "methodConfig": [{
                                "name": [{}],
                                "retryPolicy": {
                                    "maxAttempts": ${constants_1.RETRY_OPTIONS.maxAttempts},
                                    "initialBackoff": "${constants_1.RETRY_OPTIONS.initialBackoff}s",
                                    "maxBackoff": "${constants_1.RETRY_OPTIONS.maxBackoff}s",
                                    "backoffMultiplier": ${constants_1.RETRY_OPTIONS.backoffMultiplier},
                                    "retryableStatusCodes": [ "UNAVAILABLE" ]
                                }
                            }]
                        }`,
            },
            package: 'BusinessDataModel',
            protoPath: path.resolve(__dirname, '../../../src/protos/attribute/rpc.proto'),
            url: `${constants_1.ATTRIBUTE_SERVICE}:${constants_1.GRPC_PORT}`,
            loader: { keepCase: true, defaults: true }
        }
    }),
    __metadata("design:type", Object)
], BusinessRuleService.prototype, "attributeClient", void 0);
__decorate([
    (0, microservices_1.Client)({
        transport: microservices_1.Transport.GRPC,
        options: {
            channelOptions: {
                'grpc.service_config': `{
                            "methodConfig": [{
                                "name": [{}],
                                "retryPolicy": {
                                    "maxAttempts": 6,
                                    "initialBackoff": "0.1s",
                                    "maxBackoff": "1s",
                                    "backoffMultiplier": 2,
                                    "retryableStatusCodes": [ "UNAVAILABLE" ]
                                }
                            }]
                        }`,
            },
            package: 'rules',
            protoPath: path.resolve(__dirname, '../../../src/protos/businessrules/rules.proto'),
            url: `${constants_1.BUSINESS_RULE_SERVICE}:${constants_1.GRPC_PORT}`,
            loader: { keepCase: true, defaults: true },
        }
    }),
    __metadata("design:type", Object)
], BusinessRuleService.prototype, "businessRuleClient", void 0);
__decorate([
    (0, microservices_1.Client)({
        transport: microservices_1.Transport.GRPC,
        options: {
            channelOptions: {
                'grpc.service_config': `{
                        "methodConfig": [{
                            "name": [{}],
                            "retryPolicy": {
                                "maxAttempts": 6,
                                "initialBackoff": "0.1s",
                                "maxBackoff": "1s",
                                "backoffMultiplier": 2,
                                "retryableStatusCodes": [ "UNAVAILABLE" ]
                            }
                        }]
                    }`,
            },
            package: 'category',
            protoPath: path.resolve(__dirname, '../../../src/protos/category/category_service.proto'),
            url: `${constants_1.CATEGORY_SERVICE}:${constants_1.GRPC_PORT}`,
            loader: { keepCase: true, defaults: true }
        }
    }),
    __metadata("design:type", Object)
], BusinessRuleService.prototype, "categoryClient", void 0);
exports.BusinessRuleService = BusinessRuleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)('pdm')),
    __param(1, (0, typeorm_1.InjectDataSource)('pdmReader')),
    __param(2, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.DataSource, Object, common_service_1.CommonService])
], BusinessRuleService);
//# sourceMappingURL=bussinessrule.service.js.map