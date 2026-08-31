"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const sap_module_1 = require("./modules/sap/sap.module");
const typeorm_1 = require("@nestjs/typeorm");
const orm_config_1 = require("./orm.config");
const constants_1 = require("./constants/constants");
const bullmq_1 = require("@nestjs/bullmq");
const ioredis_1 = require("@nestjs-modules/ioredis");
const schedule_1 = require("@nestjs/schedule");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({ ...orm_config_1.pdmDatabaseConfig, name: 'pdm' }),
            typeorm_1.TypeOrmModule.forRoot({ ...orm_config_1.pdmReaderDatabaseConfig, name: 'pdmReader' }),
            sap_module_1.SapModule,
            ioredis_1.RedisModule.forRoot({
                type: 'single',
                url: constants_1.REDIS_CONNECTION,
                options: {
                    connectTimeout: 90100100
                }
            }),
            bullmq_1.BullModule.forRoot({
                connection: {
                    host: constants_1.REDIS_CONNECTION,
                    port: 6379,
                }
            }),
            schedule_1.ScheduleModule.forRoot()
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map