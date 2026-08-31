import { Metadata } from '@grpc/grpc-js';
import { OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { BulkUploadWorkflowRequestGrpc, InitiateListingSKURequestGrpc, SendForApprovalRequestGrpc, CheckIfPermissionGivenForCategoryRequest } from '../../dtos/new.new.sku.dto';
import { ApproveSKURequest, MetaData, RejectSKURequest } from "../../dtos/new.new.sku.dto";
export declare class WorkflowService implements OnModuleInit {
    workflowClient: ClientGrpc;
    private workflowService;
    onModuleInit(): void;
    addMetadata(metaData: MetaData): Promise<Metadata>;
    getCategoryIdForUserWithWorkflow(metaData: MetaData): Promise<any>;
    approveSKU(request: ApproveSKURequest, metaData: MetaData): Promise<boolean>;
    rejectSKU(request: RejectSKURequest, metaData: MetaData): Promise<boolean>;
    checkIfWorkflowExists(categoryId: number, metaData: MetaData): Promise<boolean>;
    observableToPromise(x: any): Promise<any>;
    initiateSKU(metaData: MetaData, request: InitiateListingSKURequestGrpc): Promise<boolean>;
    sendForApproval(request: SendForApprovalRequestGrpc, metaData: MetaData): Promise<boolean>;
    bulkUploadWorkflow(request: BulkUploadWorkflowRequestGrpc, metaData: MetaData): Promise<any>;
    checkIfPermissionGivenForCategory(request: CheckIfPermissionGivenForCategoryRequest, metaData: MetaData): Promise<boolean>;
    convertToPromise(v: any): Promise<any>;
}
