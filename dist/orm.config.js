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
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdmReaderDatabaseConfig = exports.pdmDatabaseConfig = void 0;
const dotenv = __importStar(require("dotenv"));
const constants_1 = require("./constants/constants");
const fixed_tables_entity_1 = require("./entities/fixed.tables.entity");
dotenv.config();
exports.pdmDatabaseConfig = {
    type: "postgres",
    username: constants_1.DB_USER,
    password: constants_1.DB_PASSWORD,
    port: parseInt(constants_1.DB_PORT),
    host: constants_1.DB_HOST,
    database: constants_1.DB1,
    synchronize: false,
    entities: [fixed_tables_entity_1.SAPMapping, fixed_tables_entity_1.UomConversionMetrics, fixed_tables_entity_1.ProductPrice, fixed_tables_entity_1.PriceUomCalculationMetadata, fixed_tables_entity_1.ProductData, fixed_tables_entity_1.ProductMetadata],
    logging: false,
};
exports.pdmReaderDatabaseConfig = {
    type: "postgres",
    username: constants_1.DB_USER,
    password: constants_1.DB_PASSWORD,
    port: parseInt(constants_1.DB_PORT),
    host: constants_1.DB_HOST_READER,
    database: constants_1.DB1,
    synchronize: false,
    entities: [fixed_tables_entity_1.SAPMapping, fixed_tables_entity_1.UomConversionMetrics, fixed_tables_entity_1.ProductPrice, fixed_tables_entity_1.PriceUomCalculationMetadata, fixed_tables_entity_1.ProductData, fixed_tables_entity_1.ProductMetadata],
    logging: false,
};
//# sourceMappingURL=orm.config.js.map