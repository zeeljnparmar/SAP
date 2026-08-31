import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job, Queue } from "bullmq";
import { SAPService } from "./sftp.transfer";
import { Cron } from '@nestjs/schedule';


@Processor('file_processing', {concurrency:1})
export class FileProcessing extends WorkerHost {

    constructor(
        private readonly sapService:SAPService
    ){
        super()
    }

    async process(job: Job<any, any, string>) {
        // console.log(job.data)
        await this.sapService.getSapFilesFromSftp(job.data, job.id)
        return {};
    }
}

@Processor('product_processing', {concurrency:1})
export class ProductProcessing extends WorkerHost {

    constructor(
        private readonly sapService:SAPService
    ){
        super()
    }

    async process(job: Job<any, any, string>) {
        // console.log(job.data)
        await this.sapService.getProductFilesFromSftp(job.data, job.id)
        return {};
    }
}

export class TaskScheduler{
    constructor(
        @InjectQueue('file_processing') private fileProcessingQueue:Queue, 
        @InjectQueue('product_processing') private productProcessingQueue:Queue
    ){}

    @Cron('*/15 * * * *')
    async handleCron() {
        console.log(`Message Produced`)
        const metaData = {"org_id":"OR0001","tenant_id":"IND0015","user_id":"6784a945326b6c9ad47bbedc", subscribed_products:'' }
        await this.fileProcessingQueue.add('file_processing', metaData)
        await this.productProcessingQueue.add('product_processing', metaData)
    }
}

