import * as dotenv from 'dotenv';
dotenv.config()

//Constat Table Names
export const DEFAULT_LANGUAGE = 'en'
export const SAMACO_VARIANT_ATTRIBUTES_IN_BASIC = ['plp_promotion', 'meta_title', 'meta_keyword', 'meta_description', 'brand', 'nuemonics', 'visibility', 'weight', 'name', 'warranty_years', 'free_return', 'saudi_branch_code']
export const WARNING = `Warning: `
export const BULKUPLOAD_ERROR = `Error: `
export const DEFAULT_ATTRIBUTE_TABLE = 'default_product_attributes'
// export const CDN_URL = process.env.CDN_URL===undefined ? `https://uat-media.vinpim.com` : `https://${process.env.CDN_URL}` 
export const BULK_UPLOAD_MULTISELECT_DELIMETER = '::'
export const DEFAULT_ATTRIBUTES = ['product_name', 'code', 'article_no']
export const PRODUCT_METADATA_TABLE = 'product_metadata'
export const REDIS_CONNECTION = process.env.REDIS_CONNECTION
export const LISTER_SUBSCRIPTION = process.env.LISTER_SUBSCRIPTION
export const DB_USER = process.env.DB_USER
export const DB_PASSWORD = process.env.DB_PASSWORD
export const DB_PORT = process.env.DB_PORT
export const DB_HOST = process.env.DB_HOST
export const DB_HOST_READER = process.env.DB_HOST_READER || process.env.DB_HOST
export const DB1 = process.env.DB1
export const DB_WORKFLOW = process.env.DB_WORKFLOW
export const DB_BDM = process.env.DB_BDM
export const DB_LCAM = process.env.DB_LCAM
export const REST_PORT = process.env.REST_PORT
export const GRPC_PORT = process.env.GRPC_PORT
export const GC_PROJECT_ID = process.env.GC_PROJECT_ID
export const GC_PRIVATE_KEY = process.env.GC_PRIVATE_KEY
export const GC_CLIENT_EMAIL = process.env.GC_CLIENT_EMAIL
export const GC_CLIENT_ID = process.env.GC_CLIENT_ID
export const WORKFLOW_SERVICE = process.env.WORKFLOW_SERVICE
export const ATTRIBUTE_SERVICE = process.env.ATTRIBUTE_SERVICE
export const CATEGORY_SERVICE = process.env.CATEGORY_SERVICE
export const DATA_GOVERNANCE_SERVICE = process.env.DATA_GOVERNANCE_SERVICE
export const BUSINESS_RULE_SERVICE = process.env.BUSINESS_RULE_SERVICE
export const IMPORT_EXPORT_SERVICE = process.env.IMPORT_EXPORT_SERVICE
export const MAGENTO_PRODUCT_PUSH_SERVICE = process.env.MAGENTO_PRODUCT_PUSH_SERVICE
export const LISTER_MAPPER_SERVICE = process.env.LISTER_MAPPER_SERVICE
export const LISTER_CHANNEL_MAPPING_SERVICE = process.env.LISTER_CHANNEL_MAPPING_SERVICE
export const DIGITAL_ASSET_MANAGEMENT_SERVICE = process.env.DIGITAL_ASSET_MANAGEMENT_SERVICE
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY
export const PRICE_ATTRIBUTES_IN_PRODUCT = ['cgst', 'sgst', 'cess', 'total_tax']
export const STARQUIK_SFTP_HOST = process.env.STARQUIK_SFTP_HOST 
export const STARQUIK_SFTP_USERNAME = process.env.STARQUIK_SFTP_USERNAME
export const STARQUIK_SFTP_PASSWORD = process.env.STARQUIK_SFTP_PASSWORD
export const PRICING_INFO_ATTRIBUTE_GROUP_NAME = 'Pricing Information (Default Group by PIM)'
export const IMAGE_ATTRIBUTE_GROUP_NAME = 'Images And Videos'
export const SUCCESS = 'success'
export const VARIANT_ATTRIBUTE_GROUP_NAME = 'Variations (Default Group by PIM)'
export const RETRY_OPTIONS = {
    initialBackoff:0.1,
    maxAttempts:6,
    maxBackoff:1,
    backoffMultiplier:2
}
export const ERROR = `error`
console.log(`Reader Host: ${DB_HOST_READER}`)