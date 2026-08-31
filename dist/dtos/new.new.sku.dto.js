"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetProductResponse = exports.CreateNewResponse = exports.VariantToNormalRequest = exports.StatusUpdateDto = exports.StatusUpdateRequest = exports.GetReferenceAttributesRequest = exports.GetProductListingReq = exports.GetAllRequest = exports.CopyImagesRequest = exports.DeleteImageRequest = exports.IdealSaveVariantDataRequest = exports.IdealSaveAsDraftRequest = exports.ProductClassification = exports.IdealCreateNewRequest = exports.ProductData = exports.VariantProductMetadata = exports.ImageUploadRequest = exports.SaveAsDraftRequest = exports.GetProductRequest = exports.CreateNewRequest = exports.GetMultilingualObject = exports.UpdateMultilingualObject = exports.linkVariants = exports.InsertMultilingualObject = exports.UniqueProductIdentifier = exports.GetProductMetadataRequest = exports.SaveVariantDependentAttributeData = exports.dashboard_state = exports.SkuChannelAssignRequest = exports.MetaData = exports.DefaultAttributes = exports.MultilingualProductdata = exports.SingleProductData = exports.ReferenceValue = exports.SaveVariantDataProductData = exports.GetSkuCodesFromCategoryIdResponse = exports.GetSkuCodesFromCategoryIdRequest = exports.ExportProductDataResponse = exports.SaveVariantDataForFunction = exports.SaveVariantDataRequest = exports.AddCombinationRequest = exports.GetNormalProducts = exports.GetCategoryStatusCountResponse = exports.GetCategoryStatusCountRequest = exports.GetAllThumbnailResponse = exports.GetAllThumbnailRequest = exports.InitiateListingSKURequestGrpc = exports.CheckIfPermissionGivenForCategoryRequest = exports.evalDto = exports.fact = void 0;
exports.GetAllPricingResponseData = exports.GetAllPricingResponse = exports.ExcelFormattingMetadata = exports.CategoryTransferStatusResponse = exports.AIAssistanceRequest = exports.AuditTrailMessage = exports.varaintNormal = exports.NormalToVariantRequest = exports.AddSkuToHierarchyRequest = exports.ExportProductData = exports.ExportProductResponse = exports.ParsedExportProductData = exports.ParsedExportProductRequest = exports.ExportProductRequest = exports.RejectSKURequestWithVariant = exports.RejectSKURequest = exports.ApproveSKURequestWithVariant = exports.ApproveSKURequest = exports.GetProductRequestOpenAPI = exports.GetProductOpenAPIResponse = exports.ProductDataOpenAPI = exports.SaveProductRequestOpenAPI = exports.CreateProductRequestOpenAPI = exports.TransformedBulkUploadData = exports.MainSheetProductData = exports.MergedSheetAndAttributeData = exports.TemplateMetadata = exports.BulkUploadData = exports.BulkUploadRequest = exports.BulkUploadWorkflowRequestGrpc = exports.GetBasicProductInfoGrpcResponse = exports.RefrenceValuesIndex = exports.ImageUploadRawRequest = exports.Images = exports.VariantImage = exports.Image = exports.GetImagesResponse = exports.FileUploadRequest = exports.SKUDetailsWithVariant = exports.SendForApprovalRequestGrpcwithVariant = exports.SKUDetails = exports.SendForApprovalRequestGrpc = exports.GetImagesBySkuIdsRequest = exports.GetImagesBySkuIdsResponse = exports.Attribute = exports.AttributeGroup = exports.PDM = exports.GetProductResponseAttribute = exports.GetProductResponseAttributeGroup = exports.VariantDependentAttributes = void 0;
exports.OpenProductDTO = exports.VariantDataDTO = exports.AttributeDTO = exports.LocationData = exports.ChannelData = exports.ExportPriceDataRequest = void 0;
class fact {
    attributeName;
    value;
    attributeType;
}
exports.fact = fact;
class evalDto {
    facts;
    ruleId;
    ruleOperationType;
    lang_code;
    channelId;
    category_id;
    pdm_id;
}
exports.evalDto = evalDto;
class CheckIfPermissionGivenForCategoryRequest {
    category_id;
}
exports.CheckIfPermissionGivenForCategoryRequest = CheckIfPermissionGivenForCategoryRequest;
class InitiateListingSKURequestGrpc {
    category_id;
    sku_details;
}
exports.InitiateListingSKURequestGrpc = InitiateListingSKURequestGrpc;
class GetAllThumbnailRequest {
    data;
}
exports.GetAllThumbnailRequest = GetAllThumbnailRequest;
class GetAllThumbnailResponse {
    status;
    data;
}
exports.GetAllThumbnailResponse = GetAllThumbnailResponse;
class GetCategoryStatusCountRequest {
    type;
    filters;
    lang_code;
}
exports.GetCategoryStatusCountRequest = GetCategoryStatusCountRequest;
class GetCategoryStatusCountResponse {
    status_code;
    status;
    message;
    data;
    filters;
}
exports.GetCategoryStatusCountResponse = GetCategoryStatusCountResponse;
class GetNormalProducts {
    category_id;
    search;
    style_pdm_id;
    full_data;
    page;
    limit;
}
exports.GetNormalProducts = GetNormalProducts;
class AddCombinationRequest {
    category_id;
    variant_id;
    status;
}
exports.AddCombinationRequest = AddCombinationRequest;
class SaveVariantDataRequest {
    category_id;
    pdm_id;
    lang_code;
    timezone;
    product_data;
}
exports.SaveVariantDataRequest = SaveVariantDataRequest;
class SaveVariantDataForFunction {
    category_id;
    pdm_id;
    lang_code;
    timezone;
    product_data;
}
exports.SaveVariantDataForFunction = SaveVariantDataForFunction;
class ExportProductDataResponse {
    template_url;
    data_url;
    uuid;
    category;
    category_id;
}
exports.ExportProductDataResponse = ExportProductDataResponse;
class GetSkuCodesFromCategoryIdRequest {
    category_id;
}
exports.GetSkuCodesFromCategoryIdRequest = GetSkuCodesFromCategoryIdRequest;
class GetSkuCodesFromCategoryIdResponse {
    sku_codes;
}
exports.GetSkuCodesFromCategoryIdResponse = GetSkuCodesFromCategoryIdResponse;
class SaveVariantDataProductData {
    id;
    attribute_name;
    attribute_db_name;
    display_name;
    attribute_type;
    attribute_data_type;
    length;
    mandatory;
    reference_master_id;
    reference_attribute_id;
    attribute_value;
}
exports.SaveVariantDataProductData = SaveVariantDataProductData;
class ReferenceValue {
    id;
    value;
    status;
}
exports.ReferenceValue = ReferenceValue;
class SingleProductData {
    productMetadata;
    productAttributes;
    variantProductDatas;
}
exports.SingleProductData = SingleProductData;
class MultilingualProductdata {
    lang_code;
    productData;
}
exports.MultilingualProductdata = MultilingualProductdata;
class DefaultAttributes {
    product_name;
    code;
}
exports.DefaultAttributes = DefaultAttributes;
class MetaData {
    tenant_id;
    org_id;
    user_id;
    subscribed_products;
    request_source;
    ip;
}
exports.MetaData = MetaData;
class SkuChannelAssignRequest {
    category_id;
    pdm_id;
    channel_id;
    status;
    operation;
    sku_code;
}
exports.SkuChannelAssignRequest = SkuChannelAssignRequest;
class dashboard_state {
    Ready_to_Publish;
    Pending_Approvals;
    Rejected;
    Drafts;
    Deactivated;
}
exports.dashboard_state = dashboard_state;
class SaveVariantDependentAttributeData {
    lang_code;
    category_id;
    variant_data;
    send_for_approval;
}
exports.SaveVariantDependentAttributeData = SaveVariantDependentAttributeData;
class GetProductMetadataRequest {
    tenant_id;
    org_id;
    category_id;
    pdm_id;
}
exports.GetProductMetadataRequest = GetProductMetadataRequest;
class UniqueProductIdentifier {
    tenant_id;
    org_id;
    category_id;
    pdm_id;
}
exports.UniqueProductIdentifier = UniqueProductIdentifier;
class InsertMultilingualObject {
    insertObject;
    onConflict;
    tableName;
    languageCode;
    idColumnName;
    use_raw;
    autoTranslated;
}
exports.InsertMultilingualObject = InsertMultilingualObject;
class linkVariants {
    lang_code;
    attribute;
    normal_pdm;
    style_pdm;
    category_id;
    tablename;
}
exports.linkVariants = linkVariants;
class UpdateMultilingualObject {
    updateObject;
    whereCondition;
    tableName;
    languageCode;
    use_raw;
    autoTranslated;
}
exports.UpdateMultilingualObject = UpdateMultilingualObject;
class GetMultilingualObject {
    selectColumns;
    whereCondition;
    tableName;
    languageCode;
    use_raw;
}
exports.GetMultilingualObject = GetMultilingualObject;
class CreateNewRequest {
    category_id;
    lang_code;
    classification;
}
exports.CreateNewRequest = CreateNewRequest;
class GetProductRequest {
    category_id;
    pdm_id;
    lang_code;
    channel_id;
}
exports.GetProductRequest = GetProductRequest;
class SaveAsDraftRequest {
    category_id;
    pdm_id;
    send_for_approval;
    product_data;
    variant_data;
    lang_code;
    role_id;
    approve;
    reject;
    comment;
}
exports.SaveAsDraftRequest = SaveAsDraftRequest;
class ImageUploadRequest {
    category_id;
    pdm_id;
    variant_id;
    urls;
    lang_code;
    timezone;
}
exports.ImageUploadRequest = ImageUploadRequest;
class VariantProductMetadata {
    productMetadata;
    variantAttributes;
    variantDependentAttributes;
}
exports.VariantProductMetadata = VariantProductMetadata;
class ProductData {
    attribute_id;
    attribute_db_name;
    attribute_data_type;
    attribute_value;
    length;
}
exports.ProductData = ProductData;
class IdealCreateNewRequest {
    category_id;
    classification;
    color_variant;
    size_variant;
    other_variant;
    status;
    variant_count;
    parent_pdm_id;
    completion_percentage;
}
exports.IdealCreateNewRequest = IdealCreateNewRequest;
class ProductClassification {
    classification;
    color_variant;
    size_variant;
    other_variant;
}
exports.ProductClassification = ProductClassification;
class IdealSaveAsDraftRequest {
    category_id;
    pdm_id;
    send_for_approval;
    product_data;
    variant_data;
    lang_code;
}
exports.IdealSaveAsDraftRequest = IdealSaveAsDraftRequest;
class IdealSaveVariantDataRequest {
    category_id;
    pdm_id;
    lang_code;
    timezone;
    product_data;
}
exports.IdealSaveVariantDataRequest = IdealSaveVariantDataRequest;
class DeleteImageRequest {
    category_id;
    pdm_id;
    delete_url;
    variant_id;
}
exports.DeleteImageRequest = DeleteImageRequest;
class CopyImagesRequest {
    copy_from_id;
    copy_to_ids;
    image_urls;
    category_id;
    pdm_id;
}
exports.CopyImagesRequest = CopyImagesRequest;
class GetAllRequest {
    id;
    category_id;
    page;
    limit;
    type;
    role_id;
    lang_code;
    channel_id;
    filters;
    pre_signed;
}
exports.GetAllRequest = GetAllRequest;
class GetProductListingReq {
    page;
    limit;
    lang_code;
    key;
    channel_ids;
    filters;
}
exports.GetProductListingReq = GetProductListingReq;
class GetReferenceAttributesRequest {
    category_id;
    lang_code;
    type;
}
exports.GetReferenceAttributesRequest = GetReferenceAttributesRequest;
class StatusUpdateRequest {
    products;
}
exports.StatusUpdateRequest = StatusUpdateRequest;
class StatusUpdateDto {
    code;
    pdm_id;
    category_id;
    status;
    classification;
}
exports.StatusUpdateDto = StatusUpdateDto;
class VariantToNormalRequest {
    category_id;
    delink_ids;
    style_pdm_id;
}
exports.VariantToNormalRequest = VariantToNormalRequest;
class CreateNewResponse {
    pdm_id;
    category_id;
}
exports.CreateNewResponse = CreateNewResponse;
class GetProductResponse {
    classification;
    category_path;
    attributes;
    attribute_groups;
    completion_percentage;
    is_variant;
    parent_pdm_id;
    main_language_initiated;
    created;
    updated;
    variant_dependent_attributes;
    pdm_id;
    category_id;
    table_name;
    thumbnail_url;
    parent_sku_code;
    status;
    is_published;
    auto_translated;
    auto_translated_message;
}
exports.GetProductResponse = GetProductResponse;
class VariantDependentAttributes {
    attribute_properties;
    attribute_values;
}
exports.VariantDependentAttributes = VariantDependentAttributes;
class GetProductResponseAttributeGroup {
    id;
    attribute_group_name;
    status;
    attributes;
}
exports.GetProductResponseAttributeGroup = GetProductResponseAttributeGroup;
class GetProductResponseAttribute {
    id;
    attribute_name;
    attribute_db_name;
    display_name;
    attribute_data_type;
    attribute_type;
    length;
    mandatory;
    filter;
    editable;
    visibility;
    searchable;
    constraint;
    reference_master_id;
    reference_attribute_id;
    status;
    rule_id;
    target_rule_only;
    refrence_values;
    old_reference_values;
    attribute_value;
    input_size;
    regex;
    auto_translate;
}
exports.GetProductResponseAttribute = GetProductResponseAttribute;
class PDM {
    attributes;
    attribute_groups;
}
exports.PDM = PDM;
class AttributeGroup {
    id;
    attribute_group_name;
    status;
    attributes;
}
exports.AttributeGroup = AttributeGroup;
class Attribute {
    id;
    attribute_name;
    attribute_db_name;
    display_name;
    attribute_data_type;
    attribute_type;
    length;
    mandatory;
    filter;
    editable;
    visibility;
    searchable;
    constraint;
    reference_master_id;
    reference_attribute_id;
    status;
    rule_id;
    target_rule_only;
    auto_translate;
    category_id;
}
exports.Attribute = Attribute;
class GetImagesBySkuIdsResponse {
    sku_id;
    images;
    thumbnail;
    open_urls;
}
exports.GetImagesBySkuIdsResponse = GetImagesBySkuIdsResponse;
class GetImagesBySkuIdsRequest {
    category_id;
    sku_ids;
}
exports.GetImagesBySkuIdsRequest = GetImagesBySkuIdsRequest;
class SendForApprovalRequestGrpc {
    sku_details;
    role_id;
}
exports.SendForApprovalRequestGrpc = SendForApprovalRequestGrpc;
class SKUDetails {
    pdm_id;
    category_id;
    attribute_id;
    attribute_group_id;
}
exports.SKUDetails = SKUDetails;
class SendForApprovalRequestGrpcwithVariant {
    sku_details;
    role_id;
    auto_approval;
}
exports.SendForApprovalRequestGrpcwithVariant = SendForApprovalRequestGrpcwithVariant;
class SKUDetailsWithVariant {
    pdm_id;
    variant_pdm;
    category_id;
    attribute_id;
    attribute_group_id;
}
exports.SKUDetailsWithVariant = SKUDetailsWithVariant;
class FileUploadRequest {
    file;
    filePath;
    fileNameWithExtension;
}
exports.FileUploadRequest = FileUploadRequest;
class GetImagesResponse {
    thumbnail_index;
    thumbnail;
    images;
    variants;
    enlarged_images;
}
exports.GetImagesResponse = GetImagesResponse;
class Image {
    name;
    url;
    pre_signed_url;
    enlarged_url;
    open_url;
}
exports.Image = Image;
class VariantImage {
    id;
    variant_name;
    vImages;
    vThumbnail;
}
exports.VariantImage = VariantImage;
class Images {
    images;
}
exports.Images = Images;
class ImageUploadRawRequest {
    urls;
    category_id;
    pdm_id;
    variant_id;
    lang_code;
    timezone;
}
exports.ImageUploadRawRequest = ImageUploadRawRequest;
class RefrenceValuesIndex {
    attribute_id;
    main_sheet_formulae;
    variant_sheet_formulae;
    main_sheet_column;
    variant_sheet_column;
}
exports.RefrenceValuesIndex = RefrenceValuesIndex;
class GetBasicProductInfoGrpcResponse {
    product_name;
    code;
    created;
    last_updated;
    status;
    category_id;
    category;
    completion_percentage;
    variants;
    urn;
    thumbnail_url;
}
exports.GetBasicProductInfoGrpcResponse = GetBasicProductInfoGrpcResponse;
class BulkUploadWorkflowRequestGrpc {
    category_id;
    role_id;
    use_workflow;
    sku_details;
}
exports.BulkUploadWorkflowRequestGrpc = BulkUploadWorkflowRequestGrpc;
class BulkUploadRequest {
    path;
    rollback;
    use_workflow;
    category_id;
    uid;
    lang_code;
}
exports.BulkUploadRequest = BulkUploadRequest;
class BulkUploadData {
    sanitised_data;
    error_data;
    metadata;
}
exports.BulkUploadData = BulkUploadData;
class TemplateMetadata {
    attribute_db_name;
    column_number;
    from_variation_attribute_group;
    sheet_name;
}
exports.TemplateMetadata = TemplateMetadata;
class MergedSheetAndAttributeData {
    attribute_db_name;
    column_number;
    from_variation_attribute_group;
    sheet_name;
    id;
    attribute_name;
    display_name;
    attribute_data_type;
    attribute_type;
    length;
    mandatory;
    filter;
    editable;
    visibility;
    searchable;
    constraint;
    reference_master_id;
    reference_attribute_id;
    status;
    rule_id;
    target_rule_only;
    auto_translate;
}
exports.MergedSheetAndAttributeData = MergedSheetAndAttributeData;
class MainSheetProductData {
    sanitisedDataIndex;
    productData;
    pdmId;
    classification;
    color_variant;
    size_variant;
    other_variant;
    inDraft;
    status;
}
exports.MainSheetProductData = MainSheetProductData;
class TransformedBulkUploadData {
    mainSheetData;
}
exports.TransformedBulkUploadData = TransformedBulkUploadData;
class CreateProductRequestOpenAPI {
    category_path;
    lang_code;
    classification;
}
exports.CreateProductRequestOpenAPI = CreateProductRequestOpenAPI;
class SaveProductRequestOpenAPI {
    category_path;
    pdm_id;
    role_id;
    send_for_approval;
    product_data;
    variant_data;
    lang_code;
    timezone;
}
exports.SaveProductRequestOpenAPI = SaveProductRequestOpenAPI;
class ProductDataOpenAPI {
    attribute_group;
    attributes;
}
exports.ProductDataOpenAPI = ProductDataOpenAPI;
class GetProductOpenAPIResponse {
    product_data;
    completion_percentage;
    is_variant;
    parent_pdm_id;
    variant_dependent_attributes;
    reference_values;
}
exports.GetProductOpenAPIResponse = GetProductOpenAPIResponse;
class GetProductRequestOpenAPI {
    category_path;
    pdm_id;
    lang_code;
}
exports.GetProductRequestOpenAPI = GetProductRequestOpenAPI;
class ApproveSKURequest {
    role_id;
    lang_code;
    sku_details;
}
exports.ApproveSKURequest = ApproveSKURequest;
class ApproveSKURequestWithVariant {
    role_id;
    lang_code;
    sku_details;
}
exports.ApproveSKURequestWithVariant = ApproveSKURequestWithVariant;
class RejectSKURequest {
    role_id;
    lang_code;
    sku_details;
}
exports.RejectSKURequest = RejectSKURequest;
class RejectSKURequestWithVariant {
    role_id;
    lang_code;
    sku_details;
}
exports.RejectSKURequestWithVariant = RejectSKURequestWithVariant;
class ExportProductRequest {
    uuid;
    product_data;
    attributes;
    lang_code;
    with_data;
}
exports.ExportProductRequest = ExportProductRequest;
class ParsedExportProductRequest {
    uuid;
    product_data;
    attributes;
    lang_code;
    with_data;
}
exports.ParsedExportProductRequest = ParsedExportProductRequest;
class ParsedExportProductData {
    category_id;
    pdm_ids;
}
exports.ParsedExportProductData = ParsedExportProductData;
class ExportProductResponse {
    template_url;
    data_url;
    uuid;
}
exports.ExportProductResponse = ExportProductResponse;
[];
class ExportProductData {
    category_id;
    pdm_id;
}
exports.ExportProductData = ExportProductData;
class AddSkuToHierarchyRequest {
    sku;
    category_id;
}
exports.AddSkuToHierarchyRequest = AddSkuToHierarchyRequest;
class NormalToVariantRequest {
    pdm_id;
    category_id;
    variants;
}
exports.NormalToVariantRequest = NormalToVariantRequest;
class varaintNormal {
    category_id;
    style_pdm;
    normal_pdm;
    lang_code;
}
exports.varaintNormal = varaintNormal;
class AuditTrailMessage {
    actor;
    tenant_id;
    org_id;
    ip_address;
    event_time;
    module;
    event_status;
    action_type;
    event_name;
    description;
    additional_fields;
}
exports.AuditTrailMessage = AuditTrailMessage;
class AIAssistanceRequest {
    task;
    action;
    user_prompt;
}
exports.AIAssistanceRequest = AIAssistanceRequest;
class CategoryTransferStatusResponse {
    batch_id;
    type;
    updated_category;
    attribute;
    total_products;
    status;
    requested_by;
    transferred_at;
}
exports.CategoryTransferStatusResponse = CategoryTransferStatusResponse;
class ExcelFormattingMetadata {
    first_row_height;
    second_row_height;
    third_row_height;
    columns_width;
    vertical_alignment;
    horizontal_alignment;
    frozen_rows;
    validation_rows;
    super_mandatory_argb_color_code;
    mandatory_argb_color_code;
    non_mandatory_argb_color_code;
    compulsory_stars_argb_color_code;
    index_sheet_header_argb_color;
    null_value_placeholder;
    excel_main_image_rows;
    excel_variant_image_rows;
    data_type_row_height;
}
exports.ExcelFormattingMetadata = ExcelFormattingMetadata;
class GetAllPricingResponse {
    status;
    message;
    data;
}
exports.GetAllPricingResponse = GetAllPricingResponse;
class GetAllPricingResponseData {
    id;
    pdm_id;
    category_id;
    location_id;
    can_price_push;
    status;
    data;
}
exports.GetAllPricingResponseData = GetAllPricingResponseData;
class ExportPriceDataRequest {
    select_all;
    export_all;
    channel_id;
    timezone;
    data;
    filters;
    request;
}
exports.ExportPriceDataRequest = ExportPriceDataRequest;
class ChannelData {
    id;
    channel_name;
}
exports.ChannelData = ChannelData;
class LocationData {
    id;
    location_name;
    location_id;
}
exports.LocationData = LocationData;
class AttributeDTO {
    display_name;
    value;
}
exports.AttributeDTO = AttributeDTO;
class VariantDataDTO {
    code;
    product_name;
    thumbnail;
    possible_variants;
    images;
    product_data;
}
exports.VariantDataDTO = VariantDataDTO;
class OpenProductDTO {
    code;
    product_name;
    category;
    variant_attributes;
    classification;
    variant_count;
    thumbnail;
    images;
    product_data;
    variant_data;
}
exports.OpenProductDTO = OpenProductDTO;
//# sourceMappingURL=new.new.sku.dto.js.map