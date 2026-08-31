import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { REDIS_CONNECTION } from 'src/constants/constants';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';
import Redis from 'ioredis';
import { SAPService } from './sftp.transfer';
import { PimUploadService } from './pim.update';
import { CommonService } from '../common/common.service';
import { BusinessDataModelService } from '../interservice/business.data.model.service';
import { BusinessRuleService } from '../interservice/bussinessrule.service';
import { WorkflowService } from '../interservice/workflow.service';
import { TaskScheduler, FileProcessing, ProductProcessing } from './bull.queue';
import { ValidationService } from '../validations/validations.service';

@Module({
    imports:[
        BullModule.registerQueue({
            name:'file_processing'
        }),
        BullModule.registerQueue({
            name:'product_processing'
        }),
        CacheModule.register({
            store: redisStore,
            host: String(REDIS_CONNECTION),
            port: 6379,
        }),
    ],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: () => {
                return new Redis({
                    host: REDIS_CONNECTION, // Replace with your config
                    port: 6379,
                });
            },
        }, ProductProcessing, FileProcessing, PimUploadService, SAPService, CommonService, BusinessDataModelService, BusinessRuleService, WorkflowService, TaskScheduler, ValidationService
    ],
  exports: ['REDIS_CLIENT', ProductProcessing, FileProcessing, PimUploadService, SAPService, CommonService, BusinessDataModelService, BusinessRuleService, WorkflowService, TaskScheduler, ValidationService],
  controllers: []
})
export class SapModule {}
