import { ProductMetadata } from 'src/entities/fixed.tables.entity';

export class fact {
  attributeName: string;
  value: any;
  attributeType: string;
}

export class evalDto {
  facts: fact[];
  ruleId: string;
  ruleOperationType: string;
  lang_code: string;
  channelId?: number;
  category_id?: number;
  pdm_id?: number;
}

export class CheckIfPermissionGivenForCategoryRequest {
  category_id: number;
}

export class InitiateListingSKURequestGrpc {
  category_id: number;
  sku_details: {
    pdm_id: number;
    variant_pdm: number[];
    user_attribute_id: number[];
    user_attribute_group_id: number[];
    all_attribute_id: number[];
    all_attribute_group_id: number[];
  }[];
}

export class GetAllThumbnailRequest {
  data: {
    category_id: number;
    pdm_id: number;
  }[];
}

export class GetAllThumbnailResponse {
  status: {
    code: number;
    status: string;
    message: string;
  };
  data: {
    category_id: number;
    pdm_id: number;
    thumbnail: string;
  }[];
}

export class GetCategoryStatusCountRequest {
  type: 'status_wise' | 'category_wise';
  filters: {
    category_id: number[];
    limit: number;
    draft: boolean;
    duration: number;
  };
  lang_code: string;
}

export class GetCategoryStatusCountResponse {
  status_code: number;
  status: string;
  message: string;
  data: {
    label: string[];
    value: number[];
  }[];
  filters?: {
    category_data: {
      value: number;
      label: string;
      id_path: string;
    }[];
  }[];
}

export class GetNormalProducts {
  category_id: number;
  search: string;
  style_pdm_id: number;
  full_data?: boolean;
  //Only if pagination implemented
  page?: number;
  limit?: number;
}

export class AddCombinationRequest {
  category_id: number;
  variant_id: number;
  status: boolean;
}

//For save-variant-data API
export class SaveVariantDataRequest {
  category_id: number;
  pdm_id: number;
  lang_code: string;
  timezone: string;
  product_data: SaveVariantDataProductData[];
}

export class SaveVariantDataForFunction {
  category_id: number;
  pdm_id: number;
  lang_code: string;
  timezone: string;
  product_data: any;
}

export class ExportProductDataResponse {
  template_url: string;
  data_url: string;
  uuid: string;
  category: string;
  category_id: number;
}

export class GetSkuCodesFromCategoryIdRequest {
  category_id: number;
}

export class GetSkuCodesFromCategoryIdResponse {
  sku_codes: string[];
}

export class SaveVariantDataProductData {
  id: number;
  attribute_name: string;
  attribute_db_name: string;
  display_name: string;
  attribute_type: string;
  attribute_data_type: string;
  length: number;
  mandatory: boolean;
  reference_master_id: number;
  reference_attribute_id: number;
  attribute_value: ReferenceValue[];
}

//For Auto translation Service
// export class UpdateMultilingualObject{
//     updateObject:any
//     whereCondition:any
// }

//Common Classes
export class ReferenceValue {
  id: number;
  value: any;
  status?: boolean;
}

export class SingleProductData {
  productMetadata: ProductMetadata;
  productAttributes: any;
  variantProductDatas?: any;
}

export class MultilingualProductdata {
  lang_code: string;
  productData: any;
}

//ProductName and code
export class DefaultAttributes {
  product_name: string;
  code: string;
}

//Tenant Metadata
export class MetaData {
  tenant_id: string;
  org_id: string;
  user_id: string;
  subscribed_products: string;
  request_source?: string;
  ip?: string;
}

export class SkuChannelAssignRequest {
  category_id: number;
  pdm_id: number;
  channel_id: number;
  status: string;
  operation: string;
  sku_code: string;
}
export class dashboard_state {
  Ready_to_Publish: boolean;
  Pending_Approvals: boolean;
  Rejected: boolean;
  Drafts: boolean;
  Deactivated: boolean;
}

//Save Variant Dependent attributes data
export class SaveVariantDependentAttributeData {
  lang_code: string;
  category_id: number;
  variant_data: any;
  send_for_approval?: boolean;
}

export class GetProductMetadataRequest {
  tenant_id: string;
  org_id: string;
  category_id: number;
  pdm_id: number;
}

export class UniqueProductIdentifier {
  tenant_id: string;
  org_id: string;
  category_id: number;
  pdm_id: number;
}

//Translation Service Inputs
export class InsertMultilingualObject {
  insertObject: any;
  onConflict: string[];
  tableName: string;
  languageCode: string;
  idColumnName: string;
  use_raw: boolean;
  autoTranslated: any;
}
export class linkVariants {
  lang_code: string;
  attribute: any;
  normal_pdm: number;
  style_pdm: number;
  category_id: number;
  tablename: string;
}
export class UpdateMultilingualObject {
  updateObject: any;
  whereCondition: any;
  tableName: string;
  languageCode: string;
  use_raw: boolean;
  autoTranslated: any;
}

export class GetMultilingualObject {
  selectColumns: string[];
  whereCondition: any;
  tableName: string;
  languageCode: string;
  use_raw: boolean;
}

//API Requests

//create-new
export class CreateNewRequest {
  category_id: number;

  // @Matches()
  lang_code: string;

  classification: {
    normal: boolean;
    bom: boolean;
    variants: {
      //Attribute Id in value
      size?: number;
      color?: number;
      other?: number[];
    };
  };
}

//get-product
export class GetProductRequest {
  category_id: number;
  pdm_id: number;
  lang_code: string;
  channel_id?: number;
}

//save-as-draft
export class SaveAsDraftRequest {
  category_id: number;
  pdm_id: number;
  send_for_approval?: boolean;
  product_data: ProductData[];
  variant_data: any;
  lang_code: string;
  role_id: number;
  approve: boolean;
  reject: boolean;
  comment: string;
}

//image-upload
export class ImageUploadRequest {
  category_id: number;
  pdm_id: number;
  variant_id?: number;
  urls: string[];
  lang_code?: string;
  timezone?: string;
}

export class VariantProductMetadata {
  productMetadata: ProductMetadata;
  variantAttributes: Attribute[];
  variantDependentAttributes: Attribute[];
}

export class ProductData {
  attribute_id: number;
  attribute_db_name: string;
  attribute_data_type: string;
  attribute_value: any;
  length: number;
}

//Ideal API requests

//create-new
export class IdealCreateNewRequest {
  category_id: number;
  classification: Classification;
  color_variant: number;
  size_variant: number;
  other_variant: number[];
  status?: boolean;
  variant_count?: number;
  parent_pdm_id?: number;
  completion_percentage?: number;
}

export class ProductClassification {
  classification: Classification;
  color_variant?: number;
  size_variant?: number;
  other_variant: number[];
}

//save-as-draft
export class IdealSaveAsDraftRequest {
  category_id: number;
  pdm_id: number;
  send_for_approval?: boolean;
  product_data: any;
  variant_data: any;
  lang_code: string;
}

//save-variant-data
export class IdealSaveVariantDataRequest {
  category_id: number;
  pdm_id: number;
  lang_code: string;
  timezone: string;
  product_data: any;
}

//delete-image
export class DeleteImageRequest {
  category_id: number;
  pdm_id: number;
  delete_url: string;
  variant_id?: number[];
}

//copy-images
export class CopyImagesRequest {
  copy_from_id: number;
  copy_to_ids: number[];
  image_urls?: string[];
  category_id: number;
  pdm_id: number;
}

//display product list
export class GetAllRequest {
  id?: number;
  category_id?: number;
  page: number;
  limit: number;
  type: ProductListType;
  role_id: number;
  lang_code: string;
  channel_id?: number;
  filters: {
    sort_by: any;
    search: any;
  };
  pre_signed: boolean;
}

export class GetProductListingReq {
  page: number;
  limit: number;
  lang_code: string;
  key: StatusType;
  channel_ids: number[];
  filters: {
    sort_by: any;
    search: any;
  };
}
export class GetReferenceAttributesRequest {
  category_id: number;
  lang_code: string;
  type: ReferenceAttributeRequestType;
}

export class StatusUpdateRequest {
  products: StatusUpdateDto[];
}

export class StatusUpdateDto {
  code: string;
  pdm_id: number;
  category_id: number;
  status: boolean;
  classification: string;
}

//variant-to-normal
export class VariantToNormalRequest {
  category_id: number;
  delink_ids: number[];
  style_pdm_id: number;
}

export type ReferenceAttributeRequestType = 'all' | null | undefined;
export type ProductDataMultilingual = {
  lang_code: string;
  productData: any;
};
//API Responses
export class CreateNewResponse {
  pdm_id: number;
  category_id: number;
}

export class GetProductResponse {
  classification: Classification;
  category_path: string;
  attributes: GetProductResponseAttribute[];
  attribute_groups: GetProductResponseAttributeGroup[];
  completion_percentage: number;
  is_variant: boolean;
  parent_pdm_id: number | null;
  main_language_initiated: boolean;
  created: Date;
  updated: Date;
  variant_dependent_attributes?: VariantDependentAttributes;
  pdm_id: number;
  category_id: number;
  table_name: string;
  thumbnail_url: string;
  parent_sku_code: string;
  status: boolean;
  is_published: boolean;
  auto_translated: boolean;
  auto_translated_message: string;
}

export class VariantDependentAttributes {
  attribute_properties: GetProductResponseAttribute[];
  attribute_values: any;
}

export class GetProductResponseAttributeGroup {
  id: number;
  attribute_group_name: string;
  status: boolean;
  attributes: GetProductResponseAttribute[];
}

export class GetProductResponseAttribute {
  id: number;
  attribute_name: string;
  attribute_db_name: string;
  display_name: string;
  attribute_data_type: AttributeDataType | string;
  attribute_type: string;
  length: number;
  mandatory: boolean;
  filter: boolean;
  editable: boolean;
  visibility: boolean;
  searchable: boolean;
  constraint: boolean;
  reference_master_id: number;
  reference_attribute_id: number;
  status: boolean;
  rule_id: string;
  target_rule_only: boolean;
  refrence_values?: ReferenceValue[];
  old_reference_values?: ReferenceValue[];
  attribute_value?: any;
  input_size?: number;
  regex?: string;
  auto_translate: boolean;
}

//Grpc Responses
export class PDM {
  attributes: Attribute[];
  attribute_groups: AttributeGroup[];
}

export class AttributeGroup {
  id: number;
  attribute_group_name: string;
  status: boolean;
  attributes: Attribute[];
}

export class Attribute {
  id: number;
  attribute_name: string;
  attribute_db_name: string;
  display_name: string;
  attribute_data_type: AttributeDataType | string;
  attribute_type: string;
  length: number;
  mandatory: boolean;
  filter: boolean;
  editable: boolean;
  visibility: boolean;
  searchable: boolean;
  constraint: boolean;
  reference_master_id: number;
  reference_attribute_id: number;
  status: boolean;
  rule_id: string;
  target_rule_only: boolean;
  auto_translate: boolean;
  category_id?: number;
}

export class GetImagesBySkuIdsResponse {
  sku_id: number;
  images: string[];
  thumbnail: string;
  open_urls: string[];
}

//GRPC REQUESTS
export class GetImagesBySkuIdsRequest {
  category_id: number;
  sku_ids: number[];
}

export class SendForApprovalRequestGrpc {
  sku_details: SKUDetails[];
  role_id: number;
}

export class SKUDetails {
  pdm_id: number;
  category_id: number;
  attribute_id: number[];
  attribute_group_id: number[];
}

export class SendForApprovalRequestGrpcwithVariant {
  sku_details: SKUDetailsWithVariant[];
  role_id: number;
  auto_approval?: boolean;
}

export class SKUDetailsWithVariant {
  pdm_id: number;
  variant_pdm: number[];
  category_id: number;
  attribute_id: number[];
  attribute_group_id: number[];
}

export class FileUploadRequest {
  file: any;
  filePath: string;
  fileNameWithExtension: string;
}

export class GetImagesResponse {
  thumbnail_index: number;
  thumbnail: Image;
  images: Image[];
  variants: VariantImage[];
  enlarged_images: Image[];
}

export class Image {
  name: string;
  url: string;
  pre_signed_url: string;
  enlarged_url: string;
  open_url: string;
}

export class VariantImage {
  id: number[];
  variant_name: string[];
  vImages: Image[];
  vThumbnail: Image;
}

export class Images {
  images: any;
}

export class ImageUploadRawRequest {
  urls: string[] | string;
  category_id: number;
  pdm_id: number;
  variant_id?: number;
  lang_code?: string;
  timezone?: string;
}

export class RefrenceValuesIndex {
  attribute_id: number;
  main_sheet_formulae: string;
  variant_sheet_formulae: string;
  main_sheet_column?: number;
  variant_sheet_column?: number;
}

export class GetBasicProductInfoGrpcResponse {
  product_name: string;
  code: string;
  created: Date;
  last_updated: Date;
  status: boolean;
  category_id: number;
  category: string;
  completion_percentage: number;
  variants: number;
  urn: string;
  thumbnail_url: string;
}

export class BulkUploadWorkflowRequestGrpc {
  category_id: number;
  role_id: number;
  use_workflow: boolean;
  sku_details: {
    pdm_id: number;
    user_attribute_id: number[];
    user_attribute_group_id: number[];
    all_attribute_id: number[];
    all_attribute_group_id: number[];
  }[];
}

export class BulkUploadRequest {
  path: string;
  rollback: boolean;
  use_workflow: boolean;
  category_id: number;
  uid: string;
  lang_code: string;
}

export type BulkProcesstype = 'create' | 'edit';

export class BulkUploadData {
  sanitised_data: any[];
  error_data: any[];
  metadata?: TemplateMetadata[];
}

export class TemplateMetadata {
  attribute_db_name: string;
  column_number: number;
  from_variation_attribute_group: boolean;
  sheet_name: SheetType;
}

export class MergedSheetAndAttributeData {
  attribute_db_name: string;
  column_number: number;
  from_variation_attribute_group: boolean;
  sheet_name: SheetType;
  id: number;
  attribute_name: string;
  display_name: string;
  attribute_data_type: AttributeDataType | string;
  attribute_type: string;
  length: number;
  mandatory: boolean;
  filter: boolean;
  editable: boolean;
  visibility: boolean;
  searchable: boolean;
  constraint: boolean;
  reference_master_id: number;
  reference_attribute_id: number;
  status: boolean;
  rule_id: string;
  target_rule_only: boolean;
  auto_translate: boolean;
}

export class MainSheetProductData {
  sanitisedDataIndex: number;
  productData: any;
  pdmId?: number;
  classification: Classification;
  color_variant: number;
  size_variant: number;
  other_variant: number[];
  inDraft: boolean;
  status: boolean;
}

export class TransformedBulkUploadData {
  mainSheetData: MainSheetProductData[];
}

export type SheetName =
  | 'Product Variant'
  | 'Product Images'
  | 'Product Variant';
export type SheetType = 'variant' | 'main';

//Open APIs
export class CreateProductRequestOpenAPI {
  category_path?: string;
  lang_code: string;
  classification: {
    normal: boolean;
    bom: boolean;
    variants: {
      //Attribute Id in value
      size?: string;
      color?: string;
      other?: string[];
    };
  };
}

export class SaveProductRequestOpenAPI {
  category_path: string;
  pdm_id: number;
  role_id?: number;
  send_for_approval?: boolean;
  product_data: any;
  variant_data?: any;
  lang_code?: string;
  timezone?: string;
}

export class ProductDataOpenAPI {
  attribute_group: string;
  attributes: any;
}

export class GetProductOpenAPIResponse {
  product_data: ProductDataOpenAPI[];
  completion_percentage: number;
  is_variant: boolean;
  parent_pdm_id: number;
  variant_dependent_attributes: any[];
  reference_values: any;
}

export class GetProductRequestOpenAPI {
  category_path: string;
  pdm_id: number;
  lang_code: string;
}

export class ApproveSKURequest {
  role_id: number;
  lang_code: string;
  sku_details: {
    pdm_id: number;
    category_id: number;
  }[];
}
export class ApproveSKURequestWithVariant {
  role_id: number;
  lang_code: string;
  sku_details: {
    pdm_id: number;
    variant_pdm: number[];
    category_id: number;
  }[];
}

export class RejectSKURequest {
  role_id: number;
  lang_code: string;
  sku_details: {
    pdm_id: number;
    category_id: number;
    comment: string;
  }[];
}
export class RejectSKURequestWithVariant {
  role_id: number;
  lang_code: string;
  sku_details: {
    pdm_id: number;
    variant_pdm: number[];
    category_id: number;
    comment: string;
  }[];
}

export class ExportProductRequest {
  uuid: string;
  product_data: ExportProductData[];
  attributes: string[];
  lang_code: string;
  with_data: boolean;
}

export class ParsedExportProductRequest {
  uuid: string;
  product_data: ParsedExportProductData[];
  attributes: string[];
  lang_code: string;
  with_data: boolean;
}

export class ParsedExportProductData {
  category_id: number;
  pdm_ids: number[];
}

export class ExportProductResponse {
  template_url: string;
  data_url: string;
  uuid: string;
}
[];

export class ExportProductData {
  category_id: number;
  pdm_id: number;
}

export class AddSkuToHierarchyRequest {
  sku: string;
  category_id: number;
}

export class NormalToVariantRequest {
  pdm_id: number;
  category_id: number;
  variants: number[];
}
export class varaintNormal {
  category_id: number;
  style_pdm: number;
  normal_pdm: number;
  lang_code: string;
}
export class AuditTrailMessage {
  actor: string;
  tenant_id: string;
  org_id: string;
  ip_address: string;
  event_time: Date;
  module: string;
  event_status: EventStatus;
  action_type: AuditTrailActionType;
  event_name: string;
  description: string;
  additional_fields: string;
}

export class AIAssistanceRequest {
  task: string;
  action: string;
  user_prompt: string;
}

export class CategoryTransferStatusResponse {
  batch_id: number;
  type: `Single Transfer` | `Bulk Transfer`;
  updated_category: string;
  attribute:
    | `Ignored Unmatched Attributes`
    | `Created Unmatched Attributes`
    | `Attributes Already Matched`;
  total_products: number;
  status: `Success` | `Failed`;
  requested_by: string;
  transferred_at: string;
}

export class ExcelFormattingMetadata {
  first_row_height: number;
  second_row_height: number;
  third_row_height: number;
  columns_width: number;
  vertical_alignment: VerticalAlignment;
  horizontal_alignment: HorizontalAlignment;
  frozen_rows: number;
  validation_rows: number;
  super_mandatory_argb_color_code: string;
  mandatory_argb_color_code: string;
  non_mandatory_argb_color_code: string;
  compulsory_stars_argb_color_code: string;
  index_sheet_header_argb_color: string;
  null_value_placeholder: string;
  excel_main_image_rows: number;
  excel_variant_image_rows: number;
  data_type_row_height: number;
}

export class GetAllPricingResponse {
  status;
  message;
  data: GetAllPricingResponseData[];
}

export class GetAllPricingResponseData {
  id: number;
  pdm_id: number;
  category_id: number;
  location_id: string | number;
  can_price_push: boolean;
  status: boolean;
  data: {
    attribute_name?: string;
    attribute_db_name: string;
    display_name: string;
    attribute_value: any;
    price_attribute: boolean;
    reference_master_id?: number;
    reference_attribute_id?: number;
    attribute_group_id?: number;
    dependent?: boolean;
    rule_id?: string;
    target_rule_only?: boolean;
    attr_block?: boolean;
  }[];
}

export class ExportPriceDataRequest {
    [x: string]: {};
  select_all?: boolean;
  export_all?:boolean;
  channel_id: number;
  timezone: string;
  data?: {
    category_id: number;
    location_id: number;
    pdm_id: number;
  }[];
  filters?: any;
    request: {};
}

export class ChannelData {
  id: number;
  channel_name: string;
}

export class LocationData {
  id: number;
  location_name: string;
  location_id: string;
}

//Types
type AttributeDataType =
  | 'boolean'
  | 'time with time zone'
  | 'timestamptz'
  | 'date'
  | 'int'
  | 'float'
  | 'varchar'
  | 'varchar[]'
  | 'int[]'
  | 'float[]';
export type PdmStatus = 'generated' | 'yetToGenerate' | 'generatedButEdited';
export type Classification = 'Normal' | 'BOM' | 'Variants' | 'Style';
export type ProductListType =
  | 'all'
  | 'draft'
  | 'rejected'
  | 'approved'
  | 'approval_pending'
  | 'sent_for_approval'
  | 'ready_to_publish'
  | 'all_without_roles'
  | 'all_wor_ready_to_publish'
  | 'deactivated';
export type StatusType =
  | 'All'
  | 'Ready to List'
  | 'In progress Listing'
  | 'In progress Delisting'
  | 'Listed'
  | 'Delisted'
  | 'Failed';
type AuditTrailActionType = 'Create' | 'View' | 'Update' | 'Delete';
type EventStatus = 'Failure' | 'Success';
export type VerticalAlignment =
  | 'top'
  | 'middle'
  | 'bottom'
  | 'distributed'
  | 'justify';
export type HorizontalAlignment =
  | 'distributed'
  | 'justify'
  | 'left'
  | 'center'
  | 'right'
  | 'fill'
  | 'centerContinuous';

// DTO for transformed product data

export class AttributeDTO {
  display_name: string;
  value: string | number | null;
}

export class VariantDataDTO {
  code: string;
  product_name: string;
  thumbnail: string;
  possible_variants?: string;
  images: string[];
  product_data: Record<string, AttributeDTO>;
}

export class OpenProductDTO {
  code: string;
  product_name: string;
  category: string;
  variant_attributes: any[]; // You can refine this if variant attributes have a specific shape
  classification: string;
  variant_count: number;
  thumbnail: string;
  images: string[];
  product_data: Record<string, AttributeDTO>;
  variant_data: VariantDataDTO[];
}
