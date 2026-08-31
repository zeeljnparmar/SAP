import { Attribute, CreateNewRequest, MetaData, ProductClassification } from "../../dtos/new.new.sku.dto";
import { BusinessDataModelService } from '../interservice/business.data.model.service';
import { CommonService } from '../common/common.service';
export declare class ValidationService {
    private readonly businessDataModel;
    private readonly commonService;
    constructor(businessDataModel: BusinessDataModelService, commonService: CommonService);
    createNewRequestValidation(body: CreateNewRequest): Promise<string[]>;
    bulkUploadMetadataValidation(exsitingProductMetadata: ProductClassification, sheetProductMetadata: ProductClassification): Promise<any[]>;
    productDataValidation(productData: any, categoryId: number, metaData: MetaData, attributes?: Attribute[], convertReferenceValuesToId?: boolean): Promise<string[]>;
    HTMLPartToTextPart(HTMLPart: string): Promise<string>;
}
