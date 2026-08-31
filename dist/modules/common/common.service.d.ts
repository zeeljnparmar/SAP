import { Attribute, MetaData, PDM, ReferenceValue } from "../../dtos/new.new.sku.dto";
import { DataSource } from "typeorm";
export declare class CommonService {
    private pdmDataSource;
    constructor(pdmDataSource: DataSource);
    getFlattenedAttributes(rawPdm: PDM): Promise<Attribute[]>;
    getReferenceIdsFromValues(body: Attribute, languageCode: string, metaData: MetaData, values: any[]): Promise<ReferenceValue[]>;
    getReferenceValues(body: {
        reference_attribute_id: number;
        reference_master_id: number;
    }, languageCode: string, metaData: MetaData, rmIds?: any[]): Promise<ReferenceValue[]>;
    getLangCodeAppendToTable(langCode: string): Promise<string>;
}
