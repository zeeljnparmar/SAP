import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SapModule } from './modules/sap/sap.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { pdmDatabaseConfig, pdmReaderDatabaseConfig } from 'src/orm.config';
import { REDIS_CONNECTION } from './constants/constants';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...pdmDatabaseConfig, name: 'pdm' }),
    TypeOrmModule.forRoot({ ...pdmReaderDatabaseConfig, name: 'pdmReader' })
    , SapModule, 
    RedisModule.forRoot({
        type: 'single',
        url: REDIS_CONNECTION,//${REDIS_CONNECTION}:6379,
        options:{
            connectTimeout: 90100100 //? in ms 
        }
    }),
    BullModule.forRoot({
        connection: {
            host: REDIS_CONNECTION,
            port: 6379,
        }
    }),
    ScheduleModule.forRoot()
    ],
  controllers: [AppController],
  providers: [AppService],
  
})
export class AppModule {}
