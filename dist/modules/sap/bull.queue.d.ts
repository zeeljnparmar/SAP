import { WorkerHost } from "@nestjs/bullmq";
import { Job, Queue } from "bullmq";
import { SAPService } from "./sftp.transfer";
export declare class FileProcessing extends WorkerHost {
    private readonly sapService;
    constructor(sapService: SAPService);
    process(job: Job<any, any, string>): Promise<{}>;
}
export declare class ProductProcessing extends WorkerHost {
    private readonly sapService;
    constructor(sapService: SAPService);
    process(job: Job<any, any, string>): Promise<{}>;
}
export declare class TaskScheduler {
    private fileProcessingQueue;
    private productProcessingQueue;
    constructor(fileProcessingQueue: Queue, productProcessingQueue: Queue);
    handleCron(): Promise<void>;
}
