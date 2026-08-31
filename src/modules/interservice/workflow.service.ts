import { Metadata } from '@grpc/grpc-js';
import { HttpException, OnModuleInit } from '@nestjs/common';
import { Client, ClientGrpc, Transport } from '@nestjs/microservices';
import { GRPC_PORT, RETRY_OPTIONS, SUCCESS, WORKFLOW_SERVICE } from 'src/constants/constants';
import { BulkUploadWorkflowRequestGrpc,InitiateListingSKURequestGrpc, SendForApprovalRequestGrpc, CheckIfPermissionGivenForCategoryRequest } from '../../dtos/new.new.sku.dto';
import { ApproveSKURequest, MetaData, RejectSKURequest } from 'src/dtos/new.new.sku.dto';
import * as path from 'path';

export class WorkflowService implements OnModuleInit{
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
            package: 'main',
            protoPath: path.resolve(__dirname, '../../../src/protos/workflow/workflow.proto'),
            url: `${WORKFLOW_SERVICE}:${GRPC_PORT}`,
            loader:{keepCase:true,defaults:true}
        }
    })workflowClient:ClientGrpc
    private workflowService
    // constructor(@Inject('WORKFLOW_PACKAGE') private workflowClient:ClientGrpc){}

    onModuleInit(){
        this.workflowService = this.workflowClient.getService<any>('WorkFlow')
    } 

    async addMetadata(metaData:MetaData):Promise<Metadata>{
        const metadata = new Metadata()
        metadata.add('tenant_id',metaData.tenant_id)
        metadata.add('user_id',`${metaData.user_id}`)
        metadata.add('org_id',metaData.org_id)
        metadata.add('subscribed_products',metaData.subscribed_products)
        return metadata
    }

    async getCategoryIdForUserWithWorkflow(metaData:MetaData){
        const metadata = await this.addMetadata(metaData)
        const start = Date.now()
        const idsObservable = await this.workflowService.GetCategoryIdForUserWithWorkflow({},metadata)
        const ids = await this.observableToPromise(idsObservable)
        return ids.category_ids
    }

    async approveSKU(request:ApproveSKURequest, metaData:MetaData){
        try{
            const metadata = await this.addMetadata(metaData)
            const approveObservable = await this.workflowService.ApproveSKU(request, metadata)
            const approve = await this.convertToPromise(approveObservable)
            if(approve.status!==SUCCESS) 
                throw new HttpException('Product Not Approved. Please Try Again',201)
            else return true
        }catch(e){
            console.log(`GRPC: ApproveSKU Error:${e.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`)
            throw new HttpException(``, 500)
        }
    }

    async rejectSKU(request:RejectSKURequest, metaData:MetaData){
        try{
            const metadata = await this.addMetadata(metaData)
            const rejectObservable = await this.workflowService.RejectSKU(request, metadata)
            const reject = await this.convertToPromise(rejectObservable)
            if(reject.status!==SUCCESS) 
                throw new HttpException('Product Not Rejected. Please Try Again',201)
    
            else return true
        }catch(e){
            console.log(`GRPC: RejectSKU Error:${e.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`)
            throw new HttpException(``, 500)
        }
    }

    async checkIfWorkflowExists(categoryId:number, metaData:MetaData):Promise<boolean>{
        try{
            const metadata = await this.addMetadata(metaData)
            const responseObservable = await this.workflowService.CheckIfWorkflowExists({category_id:categoryId}, metadata)
            const response = await this.convertToPromise(responseObservable)
            if(response.status!==SUCCESS) 
                throw new HttpException('Product Not Sent For Approval. Please Try Again',201)
            return response.exists
        }catch(e){
            console.log(`GRPC: CheckIfWorkflowExists Error:${e.message} || Request: ${JSON.stringify({category_id:categoryId})} || Metadata:${JSON.stringify(metaData)}`)
            throw new HttpException(``, 500)
        }
    }

    async observableToPromise(x){
        return x.toPromise()
    }

    async initiateSKU(metaData:MetaData, request:InitiateListingSKURequestGrpc){
        // console.log(JSON.stringify(request))
        // console.log(metaData)
        try{
            if(metaData.subscribed_products==='')
                metaData.subscribed_products = JSON.stringify(['Pim', 'Lister'])
            const metadata = await this.addMetadata(metaData)
            const initiateSKUObservable = await this.workflowService.InitiateSKU(request, metadata)
            const initiateSKU = await this.convertToPromise(initiateSKUObservable)
            if(initiateSKU.status!==SUCCESS)
                throw new HttpException(initiateSKU,201)
            else return true
        }catch(e){
            console.log(`GRPC: InitiateSKU Error:${e.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`)
            throw new HttpException(``, 500)
        }
    }

    async sendForApproval(request:SendForApprovalRequestGrpc, metaData:MetaData){
        try{
            // console.log(`sendSKU`)
            // console.log(request)
            const metadata = await this.addMetadata(metaData)
            const SendForApprovalObservable = await this.workflowService.SendtoApprovalSKU(request, metadata)
            const SendForApproval = await this.convertToPromise(SendForApprovalObservable)
            if(SendForApproval.status!==SUCCESS) 
                throw new HttpException('Product Not Sent For Approval. Please Try Again',201)
            else return true
        }catch(e){
            console.log(`GRPC: SendtoApprovalSKU Error:${e.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`)
            throw new HttpException(``, 500)
        }
    }

    async bulkUploadWorkflow(request:BulkUploadWorkflowRequestGrpc, metaData:MetaData){
        try{
            // console.log(`bulkSKU`)
            // console.log(request)
            const metadata = await this.addMetadata(metaData)
            const bulkUploadObservable = await this.workflowService.BulkUpload(request, metadata)
            const bulkUpload = await this.convertToPromise(bulkUploadObservable)
            if(bulkUpload.status!==SUCCESS && bulkUpload.message!='User does not have permission to this category') 
                throw new HttpException(bulkUpload,201)
            else return bulkUpload
        }catch(e){
            console.log(`GRPC: BulkUpload Error:${e.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`)
            throw new HttpException(``, 500)
        }
    }

    async checkIfPermissionGivenForCategory(request:CheckIfPermissionGivenForCategoryRequest, metaData:MetaData):Promise<boolean>{
        try{
            const metadata = await this.addMetadata(metaData)
            const permissionGivenObservable = await this.workflowService.CheckIfPermissionGivenForCategory(request, metadata)
            const permissionGiven = await this.convertToPromise(permissionGivenObservable)
            return permissionGiven.exists
        }catch(e){
            console.log(`GRPC: CheckIfPermissionGivenForCategory Error:${e.message} || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData)}`)
            throw new HttpException(``, 500)
        }
    }

    async convertToPromise(v){
        //To Convert Observable to Promise
        return v.toPromise()
    }
}
