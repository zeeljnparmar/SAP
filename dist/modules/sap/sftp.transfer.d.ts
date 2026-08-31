import { DataSource } from "typeorm";
import { PimUploadService } from "./pim.update";
import { MetaData } from "../../dtos/new.new.sku.dto";
import { BusinessDataModelService } from "../interservice/business.data.model.service";
import { CommonService } from "../common/common.service";
export declare class SAPService {
    private pdmDataSource;
    private pdmReaderDataSource;
    private readonly productPricingService;
    private readonly businessDataModelService;
    private readonly commonService;
    constructor(pdmDataSource: DataSource, pdmReaderDataSource: DataSource, productPricingService: PimUploadService, businessDataModelService: BusinessDataModelService, commonService: CommonService);
    removeDuplicatesRetainLast(arr: any, key: any): Promise<any[]>;
    sftpPriceTransfer(sftp: any): Promise<void>;
    convertToXML(str: string): Promise<any>;
    sftpInvTransfer(sftp: any): Promise<void>;
    sftpArtTransfer(sftp: any): Promise<void>;
    sftpEanTransfer(sftp: any): Promise<void>;
    dateToTime(a: string): Promise<string>;
    removeStaticMrpInconsistencies(metaData: MetaData): Promise<void>;
    getProductFilesFromSftp(metaData: MetaData, jobId: string): Promise<void>;
    getSapFilesFromSftp(metaData: MetaData, jobId?: any): Promise<void>;
    removeSapStoreStatusInconsistencies(metaData: MetaData): Promise<void>;
}
