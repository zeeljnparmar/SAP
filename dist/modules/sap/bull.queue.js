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
exports.TaskScheduler = exports.ProductProcessing = exports.FileProcessing = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const sftp_transfer_1 = require("./sftp.transfer");
const schedule_1 = require("@nestjs/schedule");
let FileProcessing = class FileProcessing extends bullmq_1.WorkerHost {
    sapService;
    constructor(sapService) {
        super();
        this.sapService = sapService;
    }
    async process(job) {
        await this.sapService.getSapFilesFromSftp(job.data, job.id);
        return {};
    }
};
exports.FileProcessing = FileProcessing;
exports.FileProcessing = FileProcessing = __decorate([
    (0, bullmq_1.Processor)('file_processing', { concurrency: 1 }),
    __metadata("design:paramtypes", [sftp_transfer_1.SAPService])
], FileProcessing);
let ProductProcessing = class ProductProcessing extends bullmq_1.WorkerHost {
    sapService;
    constructor(sapService) {
        super();
        this.sapService = sapService;
    }
    async process(job) {
        await this.sapService.getProductFilesFromSftp(job.data, job.id);
        return {};
    }
};
exports.ProductProcessing = ProductProcessing;
exports.ProductProcessing = ProductProcessing = __decorate([
    (0, bullmq_1.Processor)('product_processing', { concurrency: 1 }),
    __metadata("design:paramtypes", [sftp_transfer_1.SAPService])
], ProductProcessing);
let TaskScheduler = class TaskScheduler {
    fileProcessingQueue;
    productProcessingQueue;
    constructor(fileProcessingQueue, productProcessingQueue) {
        this.fileProcessingQueue = fileProcessingQueue;
        this.productProcessingQueue = productProcessingQueue;
    }
    async handleCron() {
        console.log(`Message Produced`);
        const metaData = { "org_id": "OR0001", "tenant_id": "IND0015", "user_id": "6784a945326b6c9ad47bbedc", subscribed_products: '' };
        await this.fileProcessingQueue.add('file_processing', metaData);
        await this.productProcessingQueue.add('product_processing', metaData);
    }
};
exports.TaskScheduler = TaskScheduler;
__decorate([
    (0, schedule_1.Cron)('*/15 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TaskScheduler.prototype, "handleCron", null);
exports.TaskScheduler = TaskScheduler = __decorate([
    __param(0, (0, bullmq_1.InjectQueue)('file_processing')),
    __param(1, (0, bullmq_1.InjectQueue)('product_processing')),
    __metadata("design:paramtypes", [bullmq_2.Queue,
        bullmq_2.Queue])
], TaskScheduler);
//# sourceMappingURL=bull.queue.js.map