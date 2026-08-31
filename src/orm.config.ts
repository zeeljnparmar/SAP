import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import * as dotenv from 'dotenv'
import {DB_USER, DB_PASSWORD, DB_PORT, DB_HOST, DB1, DB_WORKFLOW, DB_BDM, DB_LCAM, DB_HOST_READER} from './constants/constants'
import { PriceUomCalculationMetadata, ProductData, ProductMetadata, ProductPrice, SAPMapping, UomConversionMetrics } from './entities/fixed.tables.entity'

dotenv.config()
export const pdmDatabaseConfig: TypeOrmModuleOptions = {
    type:  "postgres",
    username: DB_USER,
    password: DB_PASSWORD,
    port: parseInt(DB_PORT),
    host: DB_HOST,
    database: DB1,
    synchronize: false,
    entities:[SAPMapping, UomConversionMetrics, ProductPrice, PriceUomCalculationMetadata, ProductData, ProductMetadata],
    logging:false,
}

export const pdmReaderDatabaseConfig: TypeOrmModuleOptions = {
    type:  "postgres",
    username: DB_USER,
    password: DB_PASSWORD,
    port: parseInt(DB_PORT),
    host: DB_HOST_READER,
    database: DB1,
    synchronize: false,
    entities:[SAPMapping, UomConversionMetrics, ProductPrice, PriceUomCalculationMetadata, ProductData, ProductMetadata ],
    logging:false,
}