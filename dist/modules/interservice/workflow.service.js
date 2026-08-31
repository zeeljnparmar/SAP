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
exports.WorkflowService = void 0;
const grpc_js_1 = require("@grpc/grpc-js");
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const constants_1 = require("../../constants/constants");
const path = __importStar(require("path"));
class WorkflowService {
    workflowClient;
    workflowService;
    onModuleInit() {
        this.workflowService = this.workflowClient.getService('WorkFlow');
    }
    async addMetadata(metaData) {
        const metadata = new grpc_js_1.Metadata();
        metadata.add('tenant_id', metaData.tenant_id);
        metadata.add('user_id', `${metaData.user_id}`);
        metadata.add('org_id', metaData.org_id);
        metadata.add('subscribed_products', metaData.subscribed_products);
        return metadata;
    }
    async getCategoryIdForUserWithWorkflow(metaData) {
        const metadata = await this.addMetadata(metaData);
        const start = Date.now();
        const idsObservable = await this.workflowService.GetCategoryIdForUserWithWorkflow({}, metadata);
        const ids = await this.observableToPromise(idsObservable);
        return ids.category_ids;
    }
    async approveSKU(request, metaData) {
        try {
            const metadata = await this.addMetadata(metaData);
            const approveObservable = await this.workflowService.ApproveSKU(request, metadata);
            const approve = await this.convertToPromise(approveObservable);
            if (approve.status !== constants_1.SUCCESS)
                throw new common_1.HttpException('Product Not Approved. Please Try Again', 201);
            else
                return true;
        }
        catch (e) {
            console.log(`GRPC: ApproveSKU Error:${e.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`);
            throw new common_1.HttpException(``, 500);
        }
    }
    async rejectSKU(request, metaData) {
        try {
            const metadata = await this.addMetadata(metaData);
            const rejectObservable = await this.workflowService.RejectSKU(request, metadata);
            const reject = await this.convertToPromise(rejectObservable);
            if (reject.status !== constants_1.SUCCESS)
                throw new common_1.HttpException('Product Not Rejected. Please Try Again', 201);
            else
                return true;
        }
        catch (e) {
            console.log(`GRPC: RejectSKU Error:${e.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`);
            throw new common_1.HttpException(``, 500);
        }
    }
    async checkIfWorkflowExists(categoryId, metaData) {
        try {
            const metadata = await this.addMetadata(metaData);
            const responseObservable = await this.workflowService.CheckIfWorkflowExists({ category_id: categoryId }, metadata);
            const response = await this.convertToPromise(responseObservable);
            if (response.status !== constants_1.SUCCESS)
                throw new common_1.HttpException('Product Not Sent For Approval. Please Try Again', 201);
            return response.exists;
        }
        catch (e) {
            console.log(`GRPC: CheckIfWorkflowExists Error:${e.message} || Request: ${JSON.stringify({ category_id: categoryId })} || Metadata:${JSON.stringify(metaData)}`);
            throw new common_1.HttpException(``, 500);
        }
    }
    async observableToPromise(x) {
        return x.toPromise();
    }
    async initiateSKU(metaData, request) {
        try {
            if (metaData.subscribed_products === '')
                metaData.subscribed_products = JSON.stringify(['Pim', 'Lister']);
            const metadata = await this.addMetadata(metaData);
            const initiateSKUObservable = await this.workflowService.InitiateSKU(request, metadata);
            const initiateSKU = await this.convertToPromise(initiateSKUObservable);
            if (initiateSKU.status !== constants_1.SUCCESS)
                throw new common_1.HttpException(initiateSKU, 201);
            else
                return true;
        }
        catch (e) {
            console.log(`GRPC: InitiateSKU Error:${e.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`);
            throw new common_1.HttpException(``, 500);
        }
    }
    async sendForApproval(request, metaData) {
        try {
            const metadata = await this.addMetadata(metaData);
            const SendForApprovalObservable = await this.workflowService.SendtoApprovalSKU(request, metadata);
            const SendForApproval = await this.convertToPromise(SendForApprovalObservable);
            if (SendForApproval.status !== constants_1.SUCCESS)
                throw new common_1.HttpException('Product Not Sent For Approval. Please Try Again', 201);
            else
                return true;
        }
        catch (e) {
            console.log(`GRPC: SendtoApprovalSKU Error:${e.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`);
            throw new common_1.HttpException(``, 500);
        }
    }
    async bulkUploadWorkflow(request, metaData) {
        try {
            const metadata = await this.addMetadata(metaData);
            const bulkUploadObservable = await this.workflowService.BulkUpload(request, metadata);
            const bulkUpload = await this.convertToPromise(bulkUploadObservable);
            if (bulkUpload.status !== constants_1.SUCCESS && bulkUpload.message != 'User does not have permission to this category')
                throw new common_1.HttpException(bulkUpload, 201);
            else
                return bulkUpload;
        }
        catch (e) {
            console.log(`GRPC: BulkUpload Error:${e.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`);
            throw new common_1.HttpException(``, 500);
        }
    }
    async checkIfPermissionGivenForCategory(request, metaData) {
        try {
            const metadata = await this.addMetadata(metaData);
            const permissionGivenObservable = await this.workflowService.CheckIfPermissionGivenForCategory(request, metadata);
            const permissionGiven = await this.convertToPromise(permissionGivenObservable);
            return permissionGiven.exists;
        }
        catch (e) {
            console.log(`GRPC: CheckIfPermissionGivenForCategory Error:${e.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`);
            throw new common_1.HttpException(``, 500);
        }
    }
    async convertToPromise(v) {
        return v.toPromise();
    }
}
exports.WorkflowService = WorkflowService;
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
            package: 'main',
            protoPath: path.resolve(__dirname, '../../../src/protos/workflow/workflow.proto'),
            url: `${constants_1.WORKFLOW_SERVICE}:${constants_1.GRPC_PORT}`,
            loader: { keepCase: true, defaults: true }
        }
    }),
    __metadata("design:type", Object)
], WorkflowService.prototype, "workflowClient", void 0);
//# sourceMappingURL=workflow.service.js.map