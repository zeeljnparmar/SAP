export type SAPMappingType = 'price' | 'product' | 'category' | 'store_codes' | 'price_batch_size';
export declare class SAPMapping {
    type: SAPMappingType;
    pim_attribute: string;
    sap_attribute: string;
}
export declare class UomConversionMetrics {
    id: number;
    uom_type: string;
    values: string[];
    conversion_multiplier: number;
}
export declare class ProductPrice {
    channel_id: number;
    location_id: number;
    pdm_id: number;
    category_id: number;
    tenant_id: string;
    org_id: string;
    price_push_status?: string;
    price: Object;
    updated_at: Date;
    user_action_id: string;
    business_rule_id: string;
    user_id: string;
    source: string;
    shopify_sync: boolean;
    eretail_sync: boolean;
}
export declare class PriceUomCalculationMetadata {
    category_id: number;
    price_attributes: string[];
    copy_attributes: string[];
    uom_attribute: string;
    variant_attribute: string;
    tenant_id: string;
    org_id: string;
}
export declare class ProductData {
    pdm_id?: number;
    category_id: number;
    tenant_id: string;
    org_id: string;
    parent_pdm_id: number;
    product_data: Object;
}
export declare class ProductMetadata {
    pdm_id: number;
    category_id: number;
    tenant_id: string;
    org_id: string;
    color_variant?: number;
    size_variant?: number;
    other_variant: number[];
    variant_published?: boolean;
    price_reference?: boolean;
    parent_pdm_id?: number;
    status?: boolean;
    classification: string;
    completion_percentage?: number;
    variant_count?: number;
    variant_deleted?: boolean;
    auto_translated?: Object;
    created_at?: Date;
    updated_at?: Date;
}
