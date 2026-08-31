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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductMetadata = exports.ProductData = exports.PriceUomCalculationMetadata = exports.ProductPrice = exports.UomConversionMetrics = exports.SAPMapping = void 0;
const typeorm_1 = require("typeorm");
let SAPMapping = class SAPMapping {
    type;
    pim_attribute;
    sap_attribute;
};
exports.SAPMapping = SAPMapping;
__decorate([
    (0, typeorm_1.PrimaryColumn)({
        type: "enum",
        enum: ["price", "product", "category", "store_codes", "price_batch_size"],
    }),
    __metadata("design:type", String)
], SAPMapping.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], SAPMapping.prototype, "pim_attribute", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SAPMapping.prototype, "sap_attribute", void 0);
exports.SAPMapping = SAPMapping = __decorate([
    (0, typeorm_1.Entity)()
], SAPMapping);
let UomConversionMetrics = class UomConversionMetrics {
    id;
    uom_type;
    values;
    conversion_multiplier;
};
exports.UomConversionMetrics = UomConversionMetrics;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UomConversionMetrics.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UomConversionMetrics.prototype, "uom_type", void 0);
__decorate([
    (0, typeorm_1.Column)('character varying', { array: true }),
    __metadata("design:type", Array)
], UomConversionMetrics.prototype, "values", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric' }),
    __metadata("design:type", Number)
], UomConversionMetrics.prototype, "conversion_multiplier", void 0);
exports.UomConversionMetrics = UomConversionMetrics = __decorate([
    (0, typeorm_1.Entity)()
], UomConversionMetrics);
let ProductPrice = class ProductPrice {
    channel_id;
    location_id;
    pdm_id;
    category_id;
    tenant_id;
    org_id;
    price_push_status;
    price;
    updated_at;
    user_action_id;
    business_rule_id;
    user_id;
    source;
    shopify_sync;
    eretail_sync;
};
exports.ProductPrice = ProductPrice;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", Number)
], ProductPrice.prototype, "channel_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", Number)
], ProductPrice.prototype, "location_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", Number)
], ProductPrice.prototype, "pdm_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", Number)
], ProductPrice.prototype, "category_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], ProductPrice.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], ProductPrice.prototype, "org_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProductPrice.prototype, "price_push_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], ProductPrice.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamptz", nullable: true, default: () => "CURRENT_TIMESTAMP(6)" }),
    __metadata("design:type", Date)
], ProductPrice.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProductPrice.prototype, "user_action_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProductPrice.prototype, "business_rule_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProductPrice.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProductPrice.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ProductPrice.prototype, "shopify_sync", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ProductPrice.prototype, "eretail_sync", void 0);
exports.ProductPrice = ProductPrice = __decorate([
    (0, typeorm_1.Entity)()
], ProductPrice);
let PriceUomCalculationMetadata = class PriceUomCalculationMetadata {
    category_id;
    price_attributes;
    copy_attributes;
    uom_attribute;
    variant_attribute;
    tenant_id;
    org_id;
};
exports.PriceUomCalculationMetadata = PriceUomCalculationMetadata;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", Number)
], PriceUomCalculationMetadata.prototype, "category_id", void 0);
__decorate([
    (0, typeorm_1.Column)('character varying', { array: true, nullable: true }),
    __metadata("design:type", Array)
], PriceUomCalculationMetadata.prototype, "price_attributes", void 0);
__decorate([
    (0, typeorm_1.Column)('character varying', { array: true, nullable: true }),
    __metadata("design:type", Array)
], PriceUomCalculationMetadata.prototype, "copy_attributes", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], PriceUomCalculationMetadata.prototype, "uom_attribute", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], PriceUomCalculationMetadata.prototype, "variant_attribute", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], PriceUomCalculationMetadata.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], PriceUomCalculationMetadata.prototype, "org_id", void 0);
exports.PriceUomCalculationMetadata = PriceUomCalculationMetadata = __decorate([
    (0, typeorm_1.Entity)()
], PriceUomCalculationMetadata);
let ProductData = class ProductData {
    pdm_id;
    category_id;
    tenant_id;
    org_id;
    parent_pdm_id;
    product_data;
};
exports.ProductData = ProductData;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ProductData.prototype, "pdm_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", Number)
], ProductData.prototype, "category_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], ProductData.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], ProductData.prototype, "org_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ProductData.prototype, "parent_pdm_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], ProductData.prototype, "product_data", void 0);
exports.ProductData = ProductData = __decorate([
    (0, typeorm_1.Entity)()
], ProductData);
let ProductMetadata = class ProductMetadata {
    pdm_id;
    category_id;
    tenant_id;
    org_id;
    color_variant;
    size_variant;
    other_variant;
    variant_published;
    price_reference;
    parent_pdm_id;
    status;
    classification;
    completion_percentage;
    variant_count;
    variant_deleted;
    auto_translated;
    created_at;
    updated_at;
};
exports.ProductMetadata = ProductMetadata;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", Number)
], ProductMetadata.prototype, "pdm_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", Number)
], ProductMetadata.prototype, "category_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], ProductMetadata.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], ProductMetadata.prototype, "org_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ProductMetadata.prototype, "color_variant", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ProductMetadata.prototype, "size_variant", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { array: true, nullable: true }),
    __metadata("design:type", Array)
], ProductMetadata.prototype, "other_variant", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ProductMetadata.prototype, "variant_published", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Boolean)
], ProductMetadata.prototype, "price_reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ProductMetadata.prototype, "parent_pdm_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ProductMetadata.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProductMetadata.prototype, "classification", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", Number)
], ProductMetadata.prototype, "completion_percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", Number)
], ProductMetadata.prototype, "variant_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ProductMetadata.prototype, "variant_deleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], ProductMetadata.prototype, "auto_translated", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP(6)" }),
    __metadata("design:type", Date)
], ProductMetadata.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" }),
    __metadata("design:type", Date)
], ProductMetadata.prototype, "updated_at", void 0);
exports.ProductMetadata = ProductMetadata = __decorate([
    (0, typeorm_1.Entity)()
], ProductMetadata);
//# sourceMappingURL=fixed.tables.entity.js.map