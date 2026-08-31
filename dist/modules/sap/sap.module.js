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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SapModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const constants_1 = require("../../constants/constants");
const cache_manager_1 = require("@nestjs/cache-manager");
const redisStore = __importStar(require("cache-manager-ioredis"));
const ioredis_1 = __importDefault(require("ioredis"));
const sftp_transfer_1 = require("./sftp.transfer");
const pim_update_1 = require("./pim.update");
const common_service_1 = require("../common/common.service");
const business_data_model_service_1 = require("../interservice/business.data.model.service");
const bussinessrule_service_1 = require("../interservice/bussinessrule.service");
const workflow_service_1 = require("../interservice/workflow.service");
const bull_queue_1 = require("./bull.queue");
const validations_service_1 = require("../validations/validations.service");
let SapModule = class SapModule {
};
exports.SapModule = SapModule;
exports.SapModule = SapModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({
                name: 'file_processing'
            }),
            bullmq_1.BullModule.registerQueue({
                name: 'product_processing'
            }),
            cache_manager_1.CacheModule.register({
                store: redisStore,
                host: String(constants_1.REDIS_CONNECTION),
                port: 6379,
            }),
        ],
        providers: [
            {
                provide: 'REDIS_CLIENT',
                useFactory: () => {
                    return new ioredis_1.default({
                        host: constants_1.REDIS_CONNECTION,
                        port: 6379,
                    });
                },
            }, bull_queue_1.ProductProcessing, bull_queue_1.FileProcessing, pim_update_1.PimUploadService, sftp_transfer_1.SAPService, common_service_1.CommonService, business_data_model_service_1.BusinessDataModelService, bussinessrule_service_1.BusinessRuleService, workflow_service_1.WorkflowService, bull_queue_1.TaskScheduler, validations_service_1.ValidationService
        ],
        exports: ['REDIS_CLIENT', bull_queue_1.ProductProcessing, bull_queue_1.FileProcessing, pim_update_1.PimUploadService, sftp_transfer_1.SAPService, common_service_1.CommonService, business_data_model_service_1.BusinessDataModelService, bussinessrule_service_1.BusinessRuleService, workflow_service_1.WorkflowService, bull_queue_1.TaskScheduler, validations_service_1.ValidationService],
        controllers: []
    })
], SapModule);
//# sourceMappingURL=sap.module.js.map