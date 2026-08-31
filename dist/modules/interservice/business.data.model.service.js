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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessDataModelService = void 0;
const grpc_js_1 = require("@grpc/grpc-js");
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const constants_1 = require("../../constants/constants");
const path = __importStar(require("path"));
const y = Date.now();
let BusinessDataModelService = class BusinessDataModelService {
    attributeClient;
    physicalDataModelService;
    attributeService;
    attributeHierarchyService;
    referenceAttributeService;
    onModuleInit() {
        this.attributeHierarchyService = this.attributeClient.getService('HierarchyManagement');
        this.physicalDataModelService = this.attributeClient.getService('PhysicalDataModelService');
        this.attributeService = this.attributeClient.getService('AttributeService');
        this.referenceAttributeService = this.attributeClient.getService('ReferenceAttributeService');
    }
    async addReferenceData(request, metaData) {
        try {
            console.log(request);
            const metadata = await this.addMetadata(metaData);
            const addReferenceDataObservable = await this.referenceAttributeService.AddReferenceData(request, metadata);
            const addReferenceDataResponse = await this.convertToPromise(addReferenceDataObservable);
            if (addReferenceDataResponse.status != constants_1.SUCCESS) {
                let errorMessage = (addReferenceDataResponse.message === undefined) ? (addReferenceDataResponse.error) : (addReferenceDataResponse.message);
                throw new common_1.HttpException(errorMessage, 500);
            }
            return addReferenceDataResponse.data[0].rmdm_id;
        }
        catch (e) {
            console.log(`GRPC: getPhysicalDataModelv2 Error:${e.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`);
            throw new common_1.HttpException(e.message, 500);
        }
    }
    async getPDM(request, metaData) {
        try {
            const metadata = await this.addMetadata(metaData);
            const getPdmResponseObservable = await this.physicalDataModelService.getPhysicalDataModel(request, metadata);
            const getPdmResponse = await this.convertToPromise(getPdmResponseObservable);
            return getPdmResponse;
        }
        catch (e) {
            console.log(`GRPC: getPhysicalDataModelv2 Error:${e.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`);
            throw new common_1.HttpException(``, 500);
        }
    }
    async getPricingDataModel(request, metaData) {
        try {
            request.id = 16916;
            const metadata = await this.addMetadata(metaData);
            const getPdmResponseObservable = await this.physicalDataModelService.GetPricingDataModel(request, metadata);
            const getPdmResponse = await this.convertToPromise(getPdmResponseObservable);
            return getPdmResponse.data;
        }
        catch (e) {
            console.log(`GRPC: getPricingDataModel Error:${e.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`);
            throw new common_1.HttpException(``, 500);
        }
    }
    async camelCaseKeysToUnderscore(obj) {
        if (typeof (obj) != "object")
            return obj;
        for (var oldName in obj) {
            var newName = oldName.replace(/([A-Z])/g, function ($1) { return "_" + $1.toLowerCase(); });
            if (newName != oldName) {
                if (obj.hasOwnProperty(oldName)) {
                    obj[newName] = obj[oldName];
                    delete obj[oldName];
                }
            }
            if (typeof (obj[newName]) == "object") {
                obj[newName] = await this.camelCaseKeysToUnderscore(obj[newName]);
            }
        }
        return obj;
    }
    async addMetadata(metaData) {
        const metadata = new grpc_js_1.Metadata();
        metadata.add('tenant_id', metaData.tenant_id);
        metadata.add('user_id', metaData.user_id);
        metadata.add('org_id', metaData.org_id);
        return metadata;
    }
    async getCategoryPDMNew(categoryId, metaData) {
        try {
            const metadata = await this.addMetadata(metaData);
            const request = { id: categoryId, lang_code: 'en' };
            const pdmObservable = await this.physicalDataModelService.GetPhysicalDataModel(request, metadata);
            const pdmCamelCase = await this.convertToPromise(pdmObservable);
            if (pdmCamelCase.status != constants_1.SUCCESS) {
                let errorMessage = (pdmCamelCase.message === undefined) ? (pdmCamelCase.error) : (pdmCamelCase.message);
                throw new common_1.HttpException(`Error "GetPhysicalDataModel" GRPC: ${errorMessage}`, 500);
            }
            const pdm = await this.camelCaseKeysToUnderscore(pdmCamelCase);
            const imageAndVideosIndex = pdm.data.attribute_groups.findIndex(x => x.attribute_group_name === 'Images And Videos');
            if (imageAndVideosIndex === -1)
                pdm.data.attribute_groups.push(imagesAndVideos);
            for (let [i, attributeGroup] of pdm.data.attribute_groups.entries()) {
                if (attributeGroup.attributes === undefined && attributeGroup.attribute_group_name != 'Images And Videos')
                    pdm.data.attribute_groups.splice(i, 1);
                if (attributeGroup.attributes === undefined || attributeGroup.attributes === null || attributeGroup.attributes.length === 0)
                    continue;
                for (let attribute of attributeGroup.attributes) {
                    const VARIANT_DEFAULT = constants_1.DEFAULT_ATTRIBUTES.map(x => `${x}_variants`);
                    if (attributeGroup.attribute_group_name === constants_1.VARIANT_ATTRIBUTE_GROUP_NAME) {
                        const index = VARIANT_DEFAULT.findIndex(x => x === attribute.attribute_db_name);
                        if (index != -1) {
                            attribute.attribute_db_name = constants_1.DEFAULT_ATTRIBUTES[index];
                        }
                    }
                    attribute['input_size'] = 6;
                    if (attribute.attribute_type === 'dropdown' || attribute.attribute_type === 'multiSelect' || attribute.attribute_type === 'singleSelect') {
                        attribute['refrence_values'] = [{ id: 1, value: 'Default' }];
                        attribute['old_reference_values'] = [{ id: 1, value: 'Default' }];
                    }
                    if (attribute.auto_translate === undefined || attribute.auto_translate === null)
                        attribute.auto_translate = true;
                    if (attribute.target_rule_only === true) {
                        if (!(attribute.attribute_value == null || attribute.attribute_value == undefined)) {
                            if (Array.isArray(attribute.attribute_value)) {
                                if (attribute.attribute_value.length === 0) {
                                    attribute['attr_block'] = true;
                                }
                            }
                            else {
                                attribute['attr_block'] = true;
                            }
                        }
                    }
                }
            }
            return pdm.data;
        }
        catch (e) {
            console.log(`GRPC: getPhysicalDataModel Error:${e.message} || Request: ${JSON.stringify({ id: categoryId, lang_code: 'en' })} || Metadata:${JSON.stringify(metaData)}`);
            throw new common_1.HttpException(``, 500);
        }
    }
    async updatePhysicalDataModel(categoryId, metaData) {
        try {
            const metadata = await this.addMetadata(metaData);
            const request = { id: categoryId, lang_code: 'en' };
            const updatePdmObservable = await this.physicalDataModelService.UpdatePhysicalDataModel(request, metadata);
            await this.convertToPromise(updatePdmObservable);
        }
        catch (e) {
            console.log(`GRPC: updatePhysicalDataModel Error:${e.message} || Request: ${JSON.stringify({ categoryId })} || Metadata:${JSON.stringify(metaData)}`);
            throw new common_1.HttpException(``, 500);
        }
    }
    async convertToPromise(v) {
        return v.toPromise();
    }
};
exports.BusinessDataModelService = BusinessDataModelService;
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
            url: `${constants_1.ATTRIBUTE_SERVICE}:50051`,
            loader: { keepCase: true, defaults: true }
        }
    }),
    __metadata("design:type", Object)
], BusinessDataModelService.prototype, "attributeClient", void 0);
exports.BusinessDataModelService = BusinessDataModelService = __decorate([
    (0, common_1.Injectable)()
], BusinessDataModelService);
const imagesAndVideos = {
    "id": -5,
    "attribute_group_name": constants_1.IMAGE_ATTRIBUTE_GROUP_NAME,
    "status": true,
    "created_at": "Mon Feb 06 2023 08:28:48 GMT+0000 (Coordinated Universal Time)",
    "updated_at": "Mon Feb 06 2023 08:28:48 GMT+0000 (Coordinated Universal Time)",
    "created_by": "auth0|63c5462fb4b6a8f1c1db9ca6",
    "updated_by": "auth0|63c5462fb4b6a8f1c1db9ca6"
};
//# sourceMappingURL=business.data.model.service.js.map