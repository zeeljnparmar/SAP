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
exports.ERROR = exports.RETRY_OPTIONS = exports.VARIANT_ATTRIBUTE_GROUP_NAME = exports.SUCCESS = exports.IMAGE_ATTRIBUTE_GROUP_NAME = exports.PRICING_INFO_ATTRIBUTE_GROUP_NAME = exports.STARQUIK_SFTP_PASSWORD = exports.STARQUIK_SFTP_USERNAME = exports.STARQUIK_SFTP_HOST = exports.PRICE_ATTRIBUTES_IN_PRODUCT = exports.GEMINI_API_KEY = exports.AWS_BUCKET_NAME = exports.DIGITAL_ASSET_MANAGEMENT_SERVICE = exports.LISTER_CHANNEL_MAPPING_SERVICE = exports.LISTER_MAPPER_SERVICE = exports.MAGENTO_PRODUCT_PUSH_SERVICE = exports.IMPORT_EXPORT_SERVICE = exports.BUSINESS_RULE_SERVICE = exports.DATA_GOVERNANCE_SERVICE = exports.CATEGORY_SERVICE = exports.ATTRIBUTE_SERVICE = exports.WORKFLOW_SERVICE = exports.GC_CLIENT_ID = exports.GC_CLIENT_EMAIL = exports.GC_PRIVATE_KEY = exports.GC_PROJECT_ID = exports.GRPC_PORT = exports.REST_PORT = exports.DB_LCAM = exports.DB_BDM = exports.DB_WORKFLOW = exports.DB1 = exports.DB_HOST_READER = exports.DB_HOST = exports.DB_PORT = exports.DB_PASSWORD = exports.DB_USER = exports.LISTER_SUBSCRIPTION = exports.REDIS_CONNECTION = exports.PRODUCT_METADATA_TABLE = exports.DEFAULT_ATTRIBUTES = exports.BULK_UPLOAD_MULTISELECT_DELIMETER = exports.DEFAULT_ATTRIBUTE_TABLE = exports.BULKUPLOAD_ERROR = exports.WARNING = exports.SAMACO_VARIANT_ATTRIBUTES_IN_BASIC = exports.DEFAULT_LANGUAGE = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
exports.DEFAULT_LANGUAGE = 'en';
exports.SAMACO_VARIANT_ATTRIBUTES_IN_BASIC = ['plp_promotion', 'meta_title', 'meta_keyword', 'meta_description', 'brand', 'nuemonics', 'visibility', 'weight', 'name', 'warranty_years', 'free_return', 'saudi_branch_code'];
exports.WARNING = `Warning: `;
exports.BULKUPLOAD_ERROR = `Error: `;
exports.DEFAULT_ATTRIBUTE_TABLE = 'default_product_attributes';
exports.BULK_UPLOAD_MULTISELECT_DELIMETER = '::';
exports.DEFAULT_ATTRIBUTES = ['product_name', 'code', 'article_no'];
exports.PRODUCT_METADATA_TABLE = 'product_metadata';
exports.REDIS_CONNECTION = process.env.REDIS_CONNECTION;
exports.LISTER_SUBSCRIPTION = process.env.LISTER_SUBSCRIPTION;
exports.DB_USER = process.env.DB_USER;
exports.DB_PASSWORD = process.env.DB_PASSWORD;
exports.DB_PORT = process.env.DB_PORT;
exports.DB_HOST = process.env.DB_HOST;
exports.DB_HOST_READER = process.env.DB_HOST_READER || process.env.DB_HOST;
exports.DB1 = process.env.DB1;
exports.DB_WORKFLOW = process.env.DB_WORKFLOW;
exports.DB_BDM = process.env.DB_BDM;
exports.DB_LCAM = process.env.DB_LCAM;
exports.REST_PORT = process.env.REST_PORT;
exports.GRPC_PORT = process.env.GRPC_PORT;
exports.GC_PROJECT_ID = process.env.GC_PROJECT_ID;
exports.GC_PRIVATE_KEY = process.env.GC_PRIVATE_KEY;
exports.GC_CLIENT_EMAIL = process.env.GC_CLIENT_EMAIL;
exports.GC_CLIENT_ID = process.env.GC_CLIENT_ID;
exports.WORKFLOW_SERVICE = process.env.WORKFLOW_SERVICE;
exports.ATTRIBUTE_SERVICE = process.env.ATTRIBUTE_SERVICE;
exports.CATEGORY_SERVICE = process.env.CATEGORY_SERVICE;
exports.DATA_GOVERNANCE_SERVICE = process.env.DATA_GOVERNANCE_SERVICE;
exports.BUSINESS_RULE_SERVICE = process.env.BUSINESS_RULE_SERVICE;
exports.IMPORT_EXPORT_SERVICE = process.env.IMPORT_EXPORT_SERVICE;
exports.MAGENTO_PRODUCT_PUSH_SERVICE = process.env.MAGENTO_PRODUCT_PUSH_SERVICE;
exports.LISTER_MAPPER_SERVICE = process.env.LISTER_MAPPER_SERVICE;
exports.LISTER_CHANNEL_MAPPING_SERVICE = process.env.LISTER_CHANNEL_MAPPING_SERVICE;
exports.DIGITAL_ASSET_MANAGEMENT_SERVICE = process.env.DIGITAL_ASSET_MANAGEMENT_SERVICE;
exports.AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
exports.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
exports.PRICE_ATTRIBUTES_IN_PRODUCT = ['cgst', 'sgst', 'cess', 'total_tax'];
exports.STARQUIK_SFTP_HOST = process.env.STARQUIK_SFTP_HOST;
exports.STARQUIK_SFTP_USERNAME = process.env.STARQUIK_SFTP_USERNAME;
exports.STARQUIK_SFTP_PASSWORD = process.env.STARQUIK_SFTP_PASSWORD;
exports.PRICING_INFO_ATTRIBUTE_GROUP_NAME = 'Pricing Information (Default Group by PIM)';
exports.IMAGE_ATTRIBUTE_GROUP_NAME = 'Images And Videos';
exports.SUCCESS = 'success';
exports.VARIANT_ATTRIBUTE_GROUP_NAME = 'Variations (Default Group by PIM)';
exports.RETRY_OPTIONS = {
    initialBackoff: 0.1,
    maxAttempts: 6,
    maxBackoff: 1,
    backoffMultiplier: 2
};
exports.ERROR = `error`;
console.log(`Reader Host: ${exports.DB_HOST_READER}`);
//# sourceMappingURL=constants.js.map