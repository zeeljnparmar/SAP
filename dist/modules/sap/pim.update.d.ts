import Redis from "ioredis";
import { Attribute, ChannelData, LocationData, MetaData, ReferenceValue } from "../../dtos/new.new.sku.dto";
import { PriceUomCalculationMetadata, ProductData, ProductPrice, UomConversionMetrics } from "../../entities/fixed.tables.entity";
import { BusinessDataModelService } from "../interservice/business.data.model.service";
import { WorkflowService } from "../interservice/workflow.service";
import { DataSource, EntityManager } from "typeorm";
import { BusinessRuleService } from "../interservice/bussinessrule.service";
import { ValidationService } from "../validations/validations.service";
export declare class PimUploadService {
    private readonly businessDataModelService;
    private readonly workflowService;
    private readonly clientRedis;
    private pdmDataSource;
    private pdmReaderDataSource;
    private readonly businessRuleService;
    private readonly validationService;
    constructor(businessDataModelService: BusinessDataModelService, workflowService: WorkflowService, clientRedis: Redis, pdmDataSource: DataSource, pdmReaderDataSource: DataSource, businessRuleService: BusinessRuleService, validationService: ValidationService);
    getLangCodeAppendToTable(langCode: string): Promise<string>;
    getReferenceValues(body: {
        reference_attribute_id: number;
        reference_master_id: number;
    }, languageCode: string, metaData: MetaData, rmIds?: any[]): Promise<ReferenceValue[]>;
    sapTriggerStoreStatus(metaData: any): Promise<void>;
    updateStoreStatusBatch(batchData: any, status: any, metaData: any): Promise<void>;
    getPricingChannels(metaData: MetaData): Promise<ChannelData[]>;
    getPricingLocations(metaData: MetaData): Promise<LocationData[]>;
    markSapPricesProcessed(batchData: any[]): Promise<void>;
    insertPriceBatch(batchData: any, metaData: MetaData, updateTime?: string): Promise<void>;
    sapTriggerPrice(metaData: MetaData, updateTime?: string, jobId?: number): Promise<{}>;
    parentPriceChanged(parentPdmId: number, categoryId: number, metaData: MetaData, entityManager: EntityManager, locationId?: number, channelId?: number, updateTime?: string): Promise<void>;
    calculateVariantPrice(variantPdmIds: number[], categoryId: number, metaData: MetaData, entityManager: EntityManager, locationId?: number, channelId?: number, updateTime?: string): Promise<void>;
    calculatePrice(pdmId: number, categoryId: number, parentProductPrices: ProductPrice[], priceUomCalculationMetaData: PriceUomCalculationMetadata, priceMultiplierValue: number): Promise<any>;
    calculatePriceMuliplier(productData: ProductData, parentProductData: ProductData, uomAttribute: Attribute, priceUomCalculationMetaData: PriceUomCalculationMetadata, uomReferenceValues: ReferenceValue[], variantAttribute: Attribute, measureReferenceValues: ReferenceValue[], uomConversionMetrics: UomConversionMetrics[]): Promise<number>;
    getColumnMetaData(pricingDataAttributes: Attribute[]): ({
        key: string;
        price_attribute: boolean;
        id: number;
        attribute_name: string;
        attribute_db_name: string;
        display_name: string;
        attribute_data_type: ("boolean" | "float" | "time with time zone" | "varchar" | "int" | "timestamptz" | "date" | "varchar[]" | "int[]" | "float[]") | string;
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
    } | {
        key: string;
        attribute_db_name: string;
        display_name: string;
        price_attribute: boolean;
    })[];
    generateBusinessRulesRequest(priceData: {
        location_id: number;
        pdm_id: number;
        category_id: number;
        channel_id: number;
        price_data: any;
    }[], metaData: MetaData, entityManager?: EntityManager): Promise<{
        location_id: number;
        pdm_id: number;
        category_id: number;
        channel_id: number;
        price_data: any;
    }[]>;
}
