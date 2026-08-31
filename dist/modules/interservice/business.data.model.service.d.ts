import { Metadata } from '@grpc/grpc-js';
import { ClientGrpc } from '@nestjs/microservices';
import { MetaData, PDM } from './../../dtos/new.new.sku.dto';
export declare class BusinessDataModelService {
    attributeClient: ClientGrpc;
    private physicalDataModelService;
    private attributeService;
    private attributeHierarchyService;
    private referenceAttributeService;
    onModuleInit(): void;
    addReferenceData(request: any, metaData: any): Promise<number>;
    getPDM(request: any, metaData: any): Promise<any>;
    getPricingDataModel(request: {
        id: number;
        lang_code: string;
    }, metaData: any): Promise<PDM>;
    camelCaseKeysToUnderscore(obj: any): Promise<any>;
    addMetadata(metaData: MetaData): Promise<Metadata>;
    getCategoryPDMNew(categoryId: number, metaData: MetaData): Promise<PDM>;
    updatePhysicalDataModel(categoryId: number, metaData: MetaData): Promise<void>;
    convertToPromise(v: any): Promise<any>;
}
