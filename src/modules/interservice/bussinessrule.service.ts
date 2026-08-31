import { forwardRef, HttpException, Inject, Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { Client, ClientGrpc, Transport } from "@nestjs/microservices";
import { DataSource, EntityManager } from 'typeorm';
import { Metadata } from "@grpc/grpc-js";
import { fact, evalDto, MetaData } from "src/dtos/new.new.sku.dto";
import { CommonService } from "../common/common.service";
import * as path from 'path';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ATTRIBUTE_SERVICE, CATEGORY_SERVICE, BUSINESS_RULE_SERVICE, DEFAULT_LANGUAGE, GRPC_PORT, SUCCESS, ERROR, RETRY_OPTIONS } from "src/constants/constants";


@Injectable()
export class BusinessRuleService {

    private bussinessRuleService;
    private attributeService;
    private businessDataModelService;

    //INFO: Creating the gRPC-client service for pim-attribute service
    @Client({
                transport: Transport.GRPC,
                options: {
                    channelOptions:{
                        'grpc.service_config':`{
                            "methodConfig": [{
                                "name": [{}],
                                "retryPolicy": {
                                    "maxAttempts": ${RETRY_OPTIONS.maxAttempts},
                                    "initialBackoff": "${RETRY_OPTIONS.initialBackoff}s",
                                    "maxBackoff": "${RETRY_OPTIONS.maxBackoff}s",
                                    "backoffMultiplier": ${RETRY_OPTIONS.backoffMultiplier},
                                    "retryableStatusCodes": [ "UNAVAILABLE" ]
                                }
                            }]
                        }`,
                    },
                    package: 'BusinessDataModel',
                    protoPath: path.resolve(__dirname, '../../../src/protos/attribute/rpc.proto' ),
                    url: `${ATTRIBUTE_SERVICE}:${GRPC_PORT}`,
                    loader: { keepCase: true, defaults: true }
                }
            })
    attributeClient: ClientGrpc;

    //INFO: Creating the gRPC-client service for pim-business-rules service
    @Client({
                transport: Transport.GRPC,
                options: {
                    channelOptions:{
                        'grpc.service_config':`{
                            "methodConfig": [{
                                "name": [{}],
                                "retryPolicy": {
                                    "maxAttempts": 6,
                                    "initialBackoff": "0.1s",
                                    "maxBackoff": "1s",
                                    "backoffMultiplier": 2,
                                    "retryableStatusCodes": [ "UNAVAILABLE" ]
                                }
                            }]
                        }`,
                    },
                    package: 'rules',
                    protoPath: path.resolve( __dirname, '../../../src/protos/businessrules/rules.proto' ),
                    url: `${BUSINESS_RULE_SERVICE}:${GRPC_PORT}`,
                    loader: { keepCase: true, defaults: true },
                }
            })
    businessRuleClient: ClientGrpc;

    @Client({
            transport: Transport.GRPC,
            options: {
                channelOptions:{
                    'grpc.service_config':`{
                        "methodConfig": [{
                            "name": [{}],
                            "retryPolicy": {
                                "maxAttempts": 6,
                                "initialBackoff": "0.1s",
                                "maxBackoff": "1s",
                                "backoffMultiplier": 2,
                                "retryableStatusCodes": [ "UNAVAILABLE" ]
                            }
                        }]
                    }`,
                },
                package: 'category',
                protoPath: path.resolve(__dirname, '../../../src/protos/category/category_service.proto'),
                url: `${CATEGORY_SERVICE}:${GRPC_PORT}`,
                loader:{keepCase:true, defaults:true}
            }
        }
        )categoryClient:ClientGrpc
        private categoryService

    

    constructor(

        @InjectDataSource('pdm')
        private pdmDataSource: DataSource,

        @InjectDataSource('pdmReader')
        private pdmReaderDataSource: DataSource,
        
        @Inject(CACHE_MANAGER) 
        private cacheManager: Cache,

        private readonly commonService: CommonService,
    ) {}

    onModuleInit() {
        //INFO: Intialising the Business Rules' Rules Service
        this.bussinessRuleService = this.businessRuleClient.getService<any>('Rules');

        //INFO: Initialising the Attribute service's Business Rule part
        this.attributeService = this.attributeClient.getService<any>('BusinessRule');

        //INFO: Initialising the Attribute Service
        this.businessDataModelService = this.attributeClient.getService<any>('AttributeService');
    
        this.categoryService = this.categoryClient.getService<any>('CategoryModifyService')

    
    }

    async getPricingRuleEvaluation(request, metaData){
        // console.log(request)
        const a = Date.now()
        let metadata = await this.addMetadata(metaData);
        let evaluatePricingRuleResponseObservable = await this.bussinessRuleService.EvaluatePricingRule( request, metadata )
        let response = await evaluatePricingRuleResponseObservable.toPromise()
        const dataArray = JSON.parse(response.data)
        return dataArray[0]
    }

  
    //GRPC: -------------------------------------------gRPC-GET-RULE-FOR-CATEGORY-------------------------------------------------------------- 
    async getRuleForCategory(request, metaData: MetaData) {
        try {

            let metadata = await this.addMetadata(metaData);


            let categoriesByPath = await this.categoryService.getTenantPathsFromAnyIds( { category_id : [request.id],lang_code: "en",get_all: true,only_leaf_ids: false }, metadata )

            let categoriesByPathResponse = await categoriesByPath.toPromise()

            categoriesByPathResponse.data = categoriesByPathResponse.data.filter(x => ( x.value === request.id  ))
      
            let categories = categoriesByPathResponse.data[0].id_path.split(",").map(Number);  

            request.id = categories;

            request.id.push(0);
            
            let rules = await this.attributeService.GetRuleForCategoryTwo( request, metadata );

            return await rules.toPromise();
        }
        catch (error) {
            console.log( `GRPC: getRuleForCategory Error:${ error.message } || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData )}` );
            throw error;
        }
    }

    //GRPC: -------------------------------------gRPC-GET-DEPENDENT-&-TARGET-ATTRIBUTES---------------------------------------------------------
    async getDependentTarget(request, metaData: MetaData) {
        try {
            let metadata = await this.addMetadata(metaData);

            let categoriesByPath = await this.categoryService.getTenantPathsFromAnyIds( { category_id : [request.category_id],lang_code: "en",get_all: true,only_leaf_ids: false }, metadata )

            let categoriesByPathResponse = await categoriesByPath.toPromise()

            categoriesByPathResponse.data = categoriesByPathResponse.data.filter(x => ( x.value === request.category_id  ))
      
            let categories = categoriesByPathResponse.data[0].id_path.split(",").map(Number);  
            
            request.category_id = categories;

            request.category_id.push(0);

            let dependentAndTargetAttributes = await this.attributeService.getDependentTarget( request, metadata );

            return await dependentAndTargetAttributes.toPromise();
        } 
        catch (error) {
            console.log( `GRPC: getDependentTarget Error:${ error.message } || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData )}` );
            throw error;
        }
    }

    //GRPC: -------------------------------------gRPC-GET-REFERENCE-DATA----------------------------------------------------
    async getReferenceData(request, metaData: MetaData) {
        try {
        const metadata = await this.addMetadata(metaData);
        let refData = await this.attributeService.getReferenceData(
            request,
            metadata,
        );
        let referenceData = await refData.toPromise();
        return referenceData;
        } 
        catch (error) {
            console.log( `GRPC: getReferenceData Error:${ error.message } || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData )}` );
            throw error;
        }
    }

    //GRPC: -------------------------------------gRPC-EVALUATE-RULE---------------------------------------------------------
    async evaluateRuleGrpc(request, metaData: MetaData) {
        try {
            const metadata = await this.addMetadata(metaData);

            const datavalue = await this.bussinessRuleService.EvaluateRule( request, metadata );

            return await datavalue.toPromise();
        } 
        catch (error) {
            console.log( `GRPC: EvaluateRule Error:${ error.message } || Request: ${JSON.stringify(request)} || Metadata:${JSON.stringify(metaData )}` );
            throw error;
            
        }
    }

    //GRPC: -------------------------------------gRPC-GET-ATTRIBUTES-BY-CATEGORY-------------------------------------------------------
    async getAttributesByCategory(categoryId: number, langCode: string, metaData: MetaData) {
        try {

            const metadata = await this.addMetadata(metaData);

            const d = await this.businessDataModelService.getAttributesByCategory({ id: [categoryId], category_name: 'DummyCategory', lang_code: langCode, page: 1, limit: 9999999}, metadata);

            return await d.toPromise();
        } 
        catch (error) {
            console.log( `GRPC: getAttributesByCategory Error:${ error.message } || Request: ${JSON.stringify({ id: [categoryId], category_name: 'DummyCategory', lang_code: langCode, page: 1, limit: 9999999})} || Metadata:${JSON.stringify(metaData )}` );
            throw error;
        }
    }

    //INFO: --------------------------------------PROCESSING-RULE-EVLUATION------------------------------------------------------------
    async rules( categoryId: number, pdmId: number, metaData: MetaData, lang_code: string, target_only: boolean, rule_type: string,pricing?:boolean, pdmInfo?: any, channel_id?: any, location_id?:any, validationData?:any, entityManager?:EntityManager, fromSAP?:boolean) {
        if(entityManager===undefined)
            entityManager = this.pdmDataSource.createEntityManager()
      try {

        //INFO: Set the flag for lister / governance
        const isLister = (channel_id != undefined && channel_id != null) ? 'lister_rules' : 'governance_rules';
        
        //INFO: Fetch all the rules for a category from attribute service
        const rulesByCategory = await this.getRuleForCategory({ id: categoryId, type: rule_type, rule_type: isLister }, metaData);
        
        //! If there was some error in fetching the rules then return the error
        if(rulesByCategory.status == "error"){
            return this.responseObject(ERROR, 'An unexpected error occurred on the server, please notify our team to resolve the issue', [])
        }

        //! If there were no rules for that category, return the same product information back
        if ( rulesByCategory.data === undefined || rulesByCategory.data.length === 0 || rulesByCategory.data[0].target_attributes === undefined || rulesByCategory.data[0].target_attributes.length === 0 ){
            return pdmInfo;
        }         

        let rules = rulesByCategory.data;

        //?---------------------------DEPRECATED-15-NOVEMBER---------------------------
        // If the evaluation is to be performed for only unconditional rules, process and remove the rules with conditions
        if (target_only == true) {
        for (let i = rules.length - 1; i >= 0; i--) {
            if ( rules[i].dependent_attributes && rules[i].dependent_attributes.length > 0 ) {
                rules.splice(i, 1);
            }
          }
        }
        // Get all the attributes for the category of the product
        // let attributesForCategory = await this.getAttributesByCategory( categoryId, lang_code, metaData );
        //If there was some error in fetching the attributes for the category then return the error
        // if(attributesForCategory.status == "error"){
        //     return this.responseObject(ERROR, 'An unexpected error occurred on the server, please notify our team to resolve the issue', [])
        // }
        // let attributeData = attributesForCategory.data;
        //?---------------------------DEPRECATED-15-NOVEMBER---------------------------


        //INFO: Set the flag for all rules to false (FALSE: Rules pending to be evaluated)
        for (let i = 0; i < rules.length; i++) {
            rules[i]['flag'] = false;
        }

        //INFO: Fetch all the dependent and target attributes for the category of the product
        let dependentAndTargetAttributes = await this.getDependentTarget( { category_id: categoryId, type: rule_type, target_only: target_only, rule_type: isLister }, metaData ); 

        //! If there was some error in fetching the dependent and target attributes then return the error
         if(dependentAndTargetAttributes.status == "error"){
            return this.responseObject(ERROR, 'An unexpected error occurred on the server, please notify our team to resolve the issue', [])
        }

        let target_attributes = dependentAndTargetAttributes.data.target_attributes;

        // ?-------------------------DEPRECATED-15-NOVEMBER-----------------
        // if(rule_type == "validation"){
            // let temp =  await this.getcolumnvalue(categoryId, pdmId, metaData)

        // }
       
        // ?----------------------------------------------------------------
        
        await this.evaluateRule( categoryId, pdmId, metaData, rules, lang_code, isLister, pdmInfo, channel_id, target_attributes,entityManager,pricing, validationData, fromSAP);
        
        return pdmInfo;

        } 
        catch (error) {
            console.log( `InternalProcess: rules Error:${ error.message } || Request:  || Metadata:${JSON.stringify(metaData )}` );
            throw error;
        }
    }

    //INFO: First call this function to start evaluating rule one by one // rule_type : {lister_rules | governance_rules}
    async evaluateRule( categoryId: number, pdmId: number, metaData: MetaData, rules, lang_code, rule_type: any, pdmInfo: any, channel_id: any, target_attributes: any,entityManager:EntityManager, pricing?:boolean, validationData?:any, fromSAP?:boolean ) {
        
        try {

            for (let i = 0; i < rules.length; i++) {
                if (rules[i].flag == false) {
                    await this.evaluateSingleRule( categoryId, pdmId, metaData, rules[i], lang_code, rule_type, pdmInfo, rules, channel_id, target_attributes,entityManager, pricing, validationData, fromSAP );
                }
            }
        } catch (error) {
            console.log( `InternalProcess: evaluateRules Error:${ error.message } || Request:  || Metadata:${JSON.stringify(metaData )}` );
            throw error;
        }
    }

    //INFO: Secondly call this function from evaluateRule to evaluate rules one by one and if cyclical rule is found then recursively evaluate the rules
    async evaluateSingleRule( categoryId: number, pdmId: number, metaData: MetaData, rule: any, lang_code, rule_type: any, pdmInfo: any, rules, channel_id: any, target_attributes: any,entityManager:EntityManager, pricing?:boolean, validationData?:any, fromSAP?:boolean  ) {
      try {

        //INFO: If the rule has some condition then process the dependent attributes and evaluate recursively
        if ( rule.dependent_attributes !== undefined && rule.dependent_attributes.length > 0) {
            for (let j = 0; j < rule.dependent_attributes.length; j++) {
  
              //INFO: When lister rules' last dependent attribute is getting processed then only evaluate else continue and for the latter process of recursive evaluation
              if ( rule_type == 'lister_rules' && rule.dependent_attributes[j] == rule.target_attributes[0]) {
                if ( rule.dependent_attributes[j] == rule.dependent_attributes[rule.dependent_attributes.length - 1]) {
                  await this.evaluation( categoryId, pdmId, metaData, rule, lang_code, rule_type, channel_id, pdmInfo,entityManager, pricing , validationData, fromSAP);
                  rule.flag = true;
                }
                continue;
              }
  
              //INFO: If the target attribute of some rule is a conditional attribute in another rule then evaluate accordingly
              if (target_attributes.includes(rule.dependent_attributes[j])) {
  
                //INFO: Finding the rule where the dependent attribute is target in a rule
                let cyclicalRule = await this.findRule(rule.dependent_attributes[j], rules);
  
                //INFO: ----------------------RECURSIVE----------------------
                await this.evaluateSingleRule( categoryId, pdmId, metaData, cyclicalRule, lang_code, rule_type, pdmInfo, rules, channel_id, target_attributes, entityManager, pricing, validationData, fromSAP );
  
                //INFO: If the dependent attribute is the last dependent attribute of the rule then evaluate
                if ( rule.dependent_attributes[j] == rule.dependent_attributes[rule.dependent_attributes.length - 1] ) {
                  await this.evaluation( categoryId, pdmId, metaData, rule, lang_code, rule_type, channel_id, pdmInfo, entityManager, pricing ,validationData, fromSAP );
                  rule.flag = true;
                }
              } 
              //INFO: If the target attribute of some rule is not a conditional attribute in another rule then directly evaluate
              else {
                if ( rule.dependent_attributes[j] == rule.dependent_attributes[rule.dependent_attributes.length - 1]) {
                  await this.evaluation( categoryId, pdmId, metaData, rule, lang_code, rule_type, channel_id, pdmInfo, entityManager, pricing ,validationData, fromSAP );
                  rule.flag = true;
                }
              }
            }
          }
          //INFO: If the rule is unconditional and has only target attribute then directly evaluate the rule
          else {
            await this.evaluation( categoryId, pdmId, metaData, rule, lang_code, rule_type, channel_id, pdmInfo,entityManager, pricing ,validationData, fromSAP );
            rule.flag = true;
          }
        } 
      catch (error) {
            console.log( `InternalProcess: evaluateSingleRule Error:${ error.message } || Request:  || Metadata:${JSON.stringify(metaData )}` );
            throw error;
        }
        
    }

    //INFO: Lastly evaluate the rules from business rules service and assign data to product information || save the data
    async evaluation( categoryId: number, pdmId: number, metaData: MetaData, rule: any, lang_code, rule_type: any, channel_id: any, pdmInfo: any,entityManager:EntityManager, pricing?:boolean, validationData?:any, fromSAP?:boolean ) {
      
      try {
        // await this.pdmDataSource.manager.transaction(async (entityManager) => {
        
            //INFO: Fetching the request for evaluation of the rule after processing & parsing
            let evalRequest = await this.findFactData( rule,pdmInfo,lang_code,metaData,pricing, validationData );

            if(pricing){
                for(let i=0;i<pdmInfo.data.length;i++){
                    if(pdmInfo.data[i].constraint == true){
                        let referenceValues = await this.commonService.getReferenceValues(pdmInfo.data[i], lang_code, metaData)
                        pdmInfo.data[i].refrence_values = referenceValues;
                    }

                }
            }

            //INFO: If any of the attribute on which business rule is applied and yet not filled then return 
            let flag = this.checkForAttrIsEmptyOrNot(rule, evalRequest.facts);
            
            for(let i=0 ; i<evalRequest.facts.length ; i++){
                evalRequest.facts[i].value = JSON.stringify(evalRequest.facts[i].value);
            }
            // [
//   'mrp',
//   'offer_margin_mechanism_6197',
//   'offer_margin_value_6198',
//   'price_type_6199'
// ]
            
            //* Return if there are no values in attributes
            if (flag) return await this.responseObject(SUCCESS, 'Success', [])
            

            //INFO: Evaluate the rule by calling the business rule service
            let savevalue = await this.evaluateRuleGrpc({   facts: evalRequest.facts,
                                                            ruleId: evalRequest.ruleId,
                                                            ruleOperationType: evalRequest.ruleOperationType,
                                                            lang_code:evalRequest.lang_code,
                                                            channelId : channel_id,
                                                            category_id : categoryId,
                                                            pdm_id : pdmId }, metaData);
                                                           

            //INFO: If the business rule was evaluated successfully, parse, save and return the final product's information
            if (savevalue.status == 'success') {
    
              //INFO: Validation Rule was evaluated successfully
              if ( rule.operation_type == 'mandatoryrules' || rule.operation_type == 'rangerules' ) {
                return savevalue;
              } 
              
              //INFO: If the rule is of filter type, then parse and return the parsed final product's information  
              else if ( rule.operation_type == 'independentfilterrules' || rule.operation_type == 'dependentfilterrules') {
                let evaluatedFilter = await this.parsePdmInfo(categoryId,pdmId,rule.operation_type,savevalue,false,pdmInfo,pricing,metaData);
                return evaluatedFilter;
              } 
              
              else {
                await this.parsePdmInfo(categoryId,pdmId,rule.operation_type,savevalue.data[0],false,pdmInfo,pricing,metaData, evalRequest.ruleId );
                
                //?-------------------------DEPRECATED-15-NOVEMBER-----------------
                let isLister = channel_id != undefined ? 'lister_rules' : 'governance_rules';
                await this.saveEvaluatedData(categoryId,pdmId,metaData,savevalue.data[0].values,isLister,entityManager, fromSAP );
              }
            } 
            //! If the rule fails and is of validation type then throw error
            else {
              if ( rule.operation_type == 'mandatoryrules' || rule.operation_type == 'rangerules' ) {
                throw new HttpException(savevalue.message, 409);
              }
            }
        //   });

      } catch (error) {
        console.log( `InternalProcess: evaluation Error:${ error.message } || Request:  || Metadata:${JSON.stringify(metaData )}` );
        throw error;
        }
    }

    //INFO: Save / Update the evaluated data by business rules for the given product
    async saveEvaluatedData( categoryId: number, pdmId: number, metaData: MetaData, values: any, rule_type: string, entityManager: EntityManager, fromSAP:boolean ) {
        
        try {

            //INFO: Create object for updating the product according to the values that are to be assigned by business rules' evaluations
            const updateObject = {};

            //INFO: Parsing the updateObject
            for (let value of values) {
                if (value.value === '' || value.value === undefined) {
                    updateObject[value.targetAttribute] = null;
                }else {
                    updateObject[value.targetAttribute] = value.value;
                }
            }

            //INFO: Update the product information if the rules are meant for governance
            if (rule_type !== 'lister_rules') {
                const skuCode = await this.pdmReaderDataSource.manager.query(`SELECT code FROM default_product_attributes WHERE pdm_id = $1 AND category_id = $2 AND tenant_id = $3 AND org_id = $4`, [pdmId, categoryId, metaData.tenant_id, metaData.org_id])
                // if(fromSAP!=true){
                    // if(skuCode[0]?.code===null || skuCode[0]?.code===undefined)
                        // await this.skuService.saveMainProductData(
                        //     {   category_id : categoryId,
                        //         pdm_id : pdmId,
                        //         product_data : updateObject,
                        //         variant_data: undefined,
                        //         lang_code : DEFAULT_LANGUAGE },
                        //     true,
                        //     [],
                        //     metaData,
                        //     entityManager,
                        // )
                
            }
        

        } catch (error) {
            console.log( `InternalProcess: saveEvaluatedData Error:${ error.message } || Request:  || Metadata:${JSON.stringify(metaData )}` );
            throw error;
        }
        

        // let columns = '';
        // let valuess = '';
        // const tableName = await this.commonService.getPdmTableName( categoryId, metaData );


        // for(let i=0;i<values.length;i++){
        //     if(values.length == 1){
        //         columns += values[i].targetAttribute
        //         if(typeof values[i].value == 'string'){
        //             if((values[i].value).length > 5){
        //                 if((values[i].value)[0] === 'A' && values[i].value[4] ==='Y' && values[i].value[5] ==='['){
        //                     valuess += values[i].value
        //                 } else {
        //                     valuess +=  `'`+ values[i].value+`'`;
        //                 }
        //             } else {
        //                 valuess +=  `'`+ values[i].value+`'`

        //             }
        //         } else {
        //             valuess +=  values[i].value
        //         }
        //     break;
        //     }
        //     if(i==0){
        //         columns += '('+values[i].targetAttribute+','
        //         if(typeof values[i].value == 'string'){
        //             valuess += '('+ `'`+ values[i].value + `'`+ ','
        //         } else {
        //             valuess += '(' +values[i].value + ','
        //         }
        //     } else  {
        //         if(i == values.length - 1){
        //             columns +=  values[i].targetAttribute + ')'
        //             if(typeof values[i].value == 'string'){
        //                 valuess +=  `'` +values[i].value + `'` + ')'
        //             } else {
        //                 valuess +=  values[i].value + ')'
        //             }
        //         } else {
        //             columns += values[i].targetAttribute + ',';
        //             if(typeof values[i].value == 'string'){
        //                 valuess += `'`+ values[i].value +`'`+ ',';
        //             } else {
        //                 valuess +=  values[i].value + ',';
        //             }
        //         }
        //     }
        //     // const tableName = (await this.pdmTablesRepository.findOne({where:{category_id:values.category_id, tenant_id:values.tenant_id, org_id:values.org_id}})).table_name
        // }
        // await entityManager.query(`UPDATE  ${tableName} SET ${columns} = ${valuess} WHERE pdm_id=${pdmId}`)
        // !--------------------------------------------DO NOT REMOVE--------------------!----------------------------------------------------------------
    }

    //INFO: Intentionally throw error for validation rules
    async saveFalseData(message: string, entityManager: EntityManager) {
        try {
            const values = await entityManager.query(`select * from pdm_in0001_or0001_1 where pdm_id='fghg'`,);
            return values;
        } 
        catch (err) {
            throw new HttpException(message, 400);
        }
    }

    //API : --------------------------------------PARSERS, PROCESSORS & CHECKS-----------------------------------------------------------------------

    //INFO: Finding the rule where the dependent attribute is target in a rule
    async findRule(attribute, rules) {
    
      try {
        for (let i = 0; i < rules.length; i++) {
            for (let j = 0; j < rules[i].target_attributes.length; j++) {
                if (rules[i].target_attributes[j] == attribute) {
                return rules[i];
                }
            }
        }
      } catch (error) {
        console.log( `InternalProcess: findRule Error:${ error.message } || Request:  ||` );
        throw error;
        }
    }

    //INFO: Check if the attributes of business rules have any value or not
    checkForAttrIsEmptyOrNot(rule, facts) {
        try {

            if ( rule.dependent_attributes != undefined || rule.dependent_attributes != null) {
                for (let i = 0; i < rule.dependent_attributes.length; i++) {
        
                    let flag = true;
                    for (let j = 0; j < facts.length; j++) {
                        if (rule.dependent_attributes[i] === facts[j].attributeName) {
                            flag = false;
                            if ( facts[j].value.value === null || facts[j].value.value === undefined || facts[j].value.value === 'Select' || facts[j].value.value === "") {
                                return true;
                            }
                        }
                    }
        
                    if (flag) {
                    return true;
                    }
                }
            }
        
            return false;
             
        } catch (error) {
            console.log( `InternalProcess: checkForAttrIsEmptyOrNot Error:${ error.message } ` );
            throw error;
        }
        
    }

    //INFO: Parsing the Product information and setting the values assigned by business rules' evaluation
    async parsePdmInfo(category_id: number, pdm_id: number, rule_type:string ,completesavevalue: any, ruleResult : boolean,pdmInfo:any,pricing:boolean,  user?: any, ruleId?: string){

      try {
        let savevalue = completesavevalue;
        if(pricing){
                            
                switch(rule_type) {
                case "defaultrules":
                    savevalue = completesavevalue["values"]
                    for (let i = 0; i < pdmInfo.data.length;i++){
                                if(pdmInfo.data[i].attribute_type == "multiSelectDropdown"  && pdmInfo.data[i].attribute_db_name == completesavevalue["targetAttribute"]){
                                    pdmInfo.data[i].attribute_value = completesavevalue["multiselectSetValues"];
                                    (pdmInfo.data[i])["attr_block"] = true;
                                }else{
                                    if(savevalue != undefined){
                                        for(let l=0;l<savevalue.length;l++){  
                                            if(pdmInfo.data[i].attribute_db_name == savevalue[l].targetAttribute){
                                                if(pdmInfo.data[i].constraint == true){
                                                    for(let n=0;n<pdmInfo.data[i].old_reference_values.length;n++){                                                
                                                        if( savevalue[l].value == pdmInfo.data[i].old_reference_values[n].id ){                                                            
                                                            
                                                            if(pdmInfo.data[i].attribute_type === 'multiSelectDropdown' ){
                                                                (pdmInfo.data[i])["attribute_value"] = completesavevalue["multiselectSetValues"];
                                                            } else {
                                                                (pdmInfo.data[i])["attribute_value"] = String(pdmInfo.data[i].old_reference_values[n].id);
                                                                (pdmInfo.data[i])["attr_block"] = true;
                                                            }

                                                        }
                                                    }
                                                } else {                                        
                                                    (pdmInfo.data[i])["attribute_value"] = savevalue[l].value;
                                                    (pdmInfo.data[i])["attr_block"] = true;
                                                }
                                            }
                                        
                                }
                            }
                        }
                    }
                    break;

                case "mandatoryrules":
                 break;
                        
                case "concatenationrules":
                    savevalue = completesavevalue["values"]
                    for (let i = 0; i < pdmInfo.data.length;i++){
                            
                                    for(let l=0;l<savevalue.length;l++){
                                        
                                        if(pdmInfo.data[i].attribute_db_name == savevalue[l].targetAttribute){

                                            (pdmInfo.data[i])["attribute_value"] = savevalue[l].value;
                                            (pdmInfo.data[i])["attr_block"] = true;
                                      
                                }
                            }
                    }
                    break;

                case "sequencerules":

                let redisKey =  `pim_`+String(category_id)+`_` + String(pdm_id) +`_${ruleId}_${user.tenant_id}_${user.org_id}`
                let val = await this.cacheManager.get(redisKey);
                if(val === undefined || val === '' || val === null){
                    for (let i = 0; i < pdmInfo.data.length;i++) {
                        for(let l=0;l<savevalue.length;l++){
                            if(pdmInfo.data[i].attribute_db_name == savevalue[l].targetAttribute){
                                (pdmInfo.data[i])["attribute_value"] = savevalue[l].value;
                                (pdmInfo.data[i])["attr_block"] = true;
                                }
                            }
                        }
                }

                                            
                        break;

                case "rangerules":
                        break;

                case "independentfilterrules": 

                    for (let i = 0; i < pdmInfo.attribute_groups.length;i++){
                        if(pdmInfo.attribute_groups[i].attributes){
                            for (let j=0; j<pdmInfo.attribute_groups[i].attributes.length;j++){
                                    for(let l=0;l<savevalue.data.length;l++){
                                        if(pdmInfo.attribute_groups[i].attributes[j].attribute_db_name == savevalue.data[l].targetAttribute){
                                            (pdmInfo.attribute_groups[i].attributes[j])["refrence_values"] = [];
                                            if((pdmInfo.attribute_groups[i].attributes[j]).attribute_type != "multiSelectDropdown"){
                                            ((pdmInfo.attribute_groups[i].attributes[j])["refrence_values"]).push({"id": 0, "value": "Select"});
                                            }
                                            (pdmInfo.attribute_groups[i].attributes[j])["attr_block"] = false;

                                            for(let k=0;k<savevalue.data[l].data_to_filter.length;k++){
                                                ((pdmInfo.attribute_groups[i].attributes[j])["refrence_values"]).push({
                                                    id:savevalue.data[l].data_to_filter[k].id,
                                                    value:savevalue.data[l].data_to_filter[k].value,
                                                    status: savevalue.data[l].data_to_filter[k].status
                                                })
                                            }

                                            let checkForConflictValue = false;
                                            if((pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] != null || (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] != undefined){
                                                for(let a=0 ; a<(pdmInfo.attribute_groups[i].attributes[j])["attribute_value"].length ; a++){
                                                    let tempflag = true;
                                                    for(let b=0 ; b<(pdmInfo.attribute_groups[i].attributes[j])["refrence_values"].length ; b++){                                                    
                                                        if((pdmInfo.attribute_groups[i].attributes[j])["attribute_value"][a].id == (pdmInfo.attribute_groups[i].attributes[j])["refrence_values"][b].id){
                                                            tempflag = false;
                                                            break;
                                                        }
                                                    }
                                                    if(tempflag){                                                    
                                                        (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] = [];
                                                        break;
                                                    }
                                                    
                                                }
                                            }
                                            

                                            (pdmInfo.attribute_groups[i].attributes[j])["rule_id"] = "filter"
    
                                        }
                                    }
                            }
                        }
                        
                    }
                    break;
                        
                case "dependentfilterrules":
                        for (let i = 0; i < pdmInfo.attribute_groups.length;i++){
                            if(pdmInfo.attribute_groups[i].attributes){
                                for (let j=0; j<pdmInfo.attribute_groups[i].attributes.length;j++){ 
                                        let filterIds:any[] = [];
                                        for(let l=0;l<savevalue.data.length;l++){
                                            if(pdmInfo.attribute_groups[i].attributes[j].attribute_db_name == savevalue.data[l].targetAttribute){
                                                (pdmInfo.attribute_groups[i].attributes[j])["refrence_values"] = [];
                                                if((pdmInfo.attribute_groups[i].attributes[j]).attribute_type != "multiSelectDropdown"){
                                                    ((pdmInfo.attribute_groups[i].attributes[j])["refrence_values"]).push({"id": 0, "value": "Select"});
                                                }
                                                
                                                for(let k=0;k<savevalue.data[l].data_to_filter.length;k++){
                                                    ((pdmInfo.attribute_groups[i].attributes[j])["refrence_values"]).push({
                                                        id:savevalue.data[l].data_to_filter[k].id,
                                                        value:savevalue.data[l].data_to_filter[k].value,
                                                        status:savevalue.data[l].data_to_filter[k].status
                                                    })
                                                    filterIds.push(savevalue.data[l].data_to_filter[k].id);
                                                }
            
                                                if((pdmInfo.attribute_groups[i].attributes[j])['attribute_value'] != null || (pdmInfo.attribute_groups[i].attributes[j])['attribute_value'] != undefined){
                                                    for(let p=0 ; p<(pdmInfo.attribute_groups[i].attributes[j])['attribute_value'].length ; p++){
                                                        let curr = (pdmInfo.attribute_groups[i].attributes[j])['attribute_value'][p].id
                                                        if(!filterIds.includes(curr)){
                                                            (pdmInfo.attribute_groups[i].attributes[j])['attribute_value'] = [];
                                                            return;     
                                                        }
                                                        
                                                    }
                                                }
                                                (pdmInfo.attribute_groups[i].attributes[j])["rule_id"] = "filter"
                                            }
                                        }  
                                    // }   
                                }
                            }
                        }
                        break;
                
        }
        } else {
            if(pdmInfo?.attribute_groups != undefined){
                            
                switch(rule_type) {
                case "defaultrules":
                    savevalue = completesavevalue["values"]
                    for (let i = 0; i < pdmInfo.attribute_groups.length;i++){
                        if(pdmInfo.attribute_groups[i].attributes){
                            for (let j=0; j<pdmInfo.attribute_groups[i].attributes.length;j++){
                                if(pdmInfo.attribute_groups[i].attributes[j].attribute_type == "multiSelectDropdown"  && pdmInfo.attribute_groups[i].attributes[j].attribute_db_name == completesavevalue["targetAttribute"]){
                                    pdmInfo.attribute_groups[i].attributes[j].attribute_value = completesavevalue["multiselectSetValues"];
                                    (pdmInfo.attribute_groups[i].attributes[j])["attr_block"] = true;
                                }else{
                                    if(savevalue != undefined){
                                        for(let l=0;l<savevalue.length;l++){  
                                                                
                                            if(pdmInfo.attribute_groups[i].attributes[j].attribute_db_name == savevalue[l].targetAttribute){
                                                if(pdmInfo.attribute_groups[i].attributes[j].constraint == true){
                                                    for(let n=0;n<pdmInfo.attribute_groups[i].attributes[j].old_reference_values.length;n++){                                                
                                                        if( savevalue[l].value == pdmInfo.attribute_groups[i].attributes[j].old_reference_values[n].id ){                                                            
                                                            
                                                            if(pdmInfo.attribute_groups[i].attributes[j].attribute_type === 'multiSelectDropdown' ){
                                                                (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] = completesavevalue["multiselectSetValues"];
                                                            } else {
                                                                (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] = String(pdmInfo.attribute_groups[i].attributes[j].old_reference_values[n].id);
                                                                (pdmInfo.attribute_groups[i].attributes[j])["attr_block"] = true;
                                                            }

                                                        }
                                                    }
                                                } else {                                        
                                                    (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] = savevalue[l].value;
                                                    (pdmInfo.attribute_groups[i].attributes[j])["attr_block"] = true;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    break;

                case "mandatoryrules":
                 break;
                        
                case "concatenationrules":
                    savevalue = completesavevalue["values"]
                    for (let i = 0; i < pdmInfo.attribute_groups.length;i++){
                            if(pdmInfo.attribute_groups[i].attributes){
                                for (let j=0; j<pdmInfo.attribute_groups[i].attributes.length;j++){
                                    for(let l=0;l<savevalue.length;l++){
                                        
                                        if(pdmInfo.attribute_groups[i].attributes[j].attribute_db_name == savevalue[l].targetAttribute){

                                            (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] = savevalue[l].value;
                                            (pdmInfo.attribute_groups[i].attributes[j])["attr_block"] = true;
                                        }
                                    }
                                }
                            }
                    }
                    break;

                case "sequencerules":
                    savevalue = completesavevalue["values"]
                        for (let i = 0; i < pdmInfo.attribute_groups.length;i++){
                            if(pdmInfo.attribute_groups[i].attributes){
                                for (let j=0; j<pdmInfo.attribute_groups[i].attributes.length;j++){
                                    for(let l=0;l<savevalue.length;l++){
                                        if(pdmInfo.attribute_groups[i].attributes[j].attribute_db_name == savevalue[l].targetAttribute){
                                            (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] = (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] ?? savevalue[l].value;
                                            (pdmInfo.attribute_groups[i].attributes[j])["attr_block"] = true;
                                        }
                                    }
                                }
                            }
                        }                    
                        break;

                case "rangerules":
                        break;

                case "independentfilterrules": 

                    for (let i = 0; i < pdmInfo.attribute_groups.length;i++){
                        if(pdmInfo.attribute_groups[i].attributes){
                            for (let j=0; j<pdmInfo.attribute_groups[i].attributes.length;j++){
                                    for(let l=0;l<savevalue.data.length;l++){
                                        if(pdmInfo.attribute_groups[i].attributes[j].attribute_db_name == savevalue.data[l].targetAttribute){
                                            (pdmInfo.attribute_groups[i].attributes[j])["refrence_values"] = [];
                                            if((pdmInfo.attribute_groups[i].attributes[j]).attribute_type != "multiSelectDropdown"){
                                            ((pdmInfo.attribute_groups[i].attributes[j])["refrence_values"]).push({"id": 0, "value": "Select"});
                                            }
                                            (pdmInfo.attribute_groups[i].attributes[j])["attr_block"] = false;

                                            for(let k=0;k<savevalue.data[l].data_to_filter.length;k++){
                                                ((pdmInfo.attribute_groups[i].attributes[j])["refrence_values"]).push({
                                                    id:savevalue.data[l].data_to_filter[k].id,
                                                    value:savevalue.data[l].data_to_filter[k].value,
                                                    status: savevalue.data[l].data_to_filter[k].status
                                                })
                                            }

                                            let checkForConflictValue = false;
                                            if((pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] != null || (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] != undefined){
                                                for(let a=0 ; a<(pdmInfo.attribute_groups[i].attributes[j])["attribute_value"].length ; a++){
                                                    let tempflag = true;
                                                    for(let b=0 ; b<(pdmInfo.attribute_groups[i].attributes[j])["refrence_values"].length ; b++){                                                    
                                                        if((pdmInfo.attribute_groups[i].attributes[j])["attribute_value"][a].id == (pdmInfo.attribute_groups[i].attributes[j])["refrence_values"][b].id){
                                                            tempflag = false;
                                                            break;
                                                        }
                                                    }
                                                    if(tempflag){                                                    
                                                        (pdmInfo.attribute_groups[i].attributes[j])["attribute_value"] = [];
                                                        break;
                                                    }
                                                    
                                                }
                                            }
                                            

                                            (pdmInfo.attribute_groups[i].attributes[j])["rule_id"] = "filter"
    
                                        }
                                    }
                            }
                        }
                        
                    }
                    break;
                        
                case "dependentfilterrules":
                        for (let i = 0; i < pdmInfo.attribute_groups.length;i++){
                            if(pdmInfo.attribute_groups[i].attributes){
                                for (let j=0; j<pdmInfo.attribute_groups[i].attributes.length;j++){ 
                                        let filterIds:any[] = [];
                                        for(let l=0;l<savevalue.data.length;l++){
                                            if(pdmInfo.attribute_groups[i].attributes[j].attribute_db_name == savevalue.data[l].targetAttribute){
                                                (pdmInfo.attribute_groups[i].attributes[j])["refrence_values"] = [];
                                                if((pdmInfo.attribute_groups[i].attributes[j]).attribute_type != "multiSelectDropdown"){
                                                    ((pdmInfo.attribute_groups[i].attributes[j])["refrence_values"]).push({"id": 0, "value": "Select"});
                                                }
                                                
                                                for(let k=0;k<savevalue.data[l].data_to_filter.length;k++){
                                                    ((pdmInfo.attribute_groups[i].attributes[j])["refrence_values"]).push({
                                                        id:savevalue.data[l].data_to_filter[k].id,
                                                        value:savevalue.data[l].data_to_filter[k].value,
                                                        status:savevalue.data[l].data_to_filter[k].status
                                                    })
                                                    filterIds.push(savevalue.data[l].data_to_filter[k].id);
                                                }
            
                                                if((pdmInfo.attribute_groups[i].attributes[j])['attribute_value'] != null || (pdmInfo.attribute_groups[i].attributes[j])['attribute_value'] != undefined){
                                                    for(let p=0 ; p<(pdmInfo.attribute_groups[i].attributes[j])['attribute_value'].length ; p++){
                                                        let curr = (pdmInfo.attribute_groups[i].attributes[j])['attribute_value'][p].id
                                                        if(!filterIds.includes(curr)){
                                                            (pdmInfo.attribute_groups[i].attributes[j])['attribute_value'] = [];
                                                            return;     
                                                        }
                                                        
                                                    }
                                                }
                                                (pdmInfo.attribute_groups[i].attributes[j])["rule_id"] = "filter"
                                            }
                                        }  
                                    // }   
                                }
                            }
                        }
                        break;
                }
        }
        }   
        

      } catch (error) {
        console.log( `InternalProcess: parsePdmInfo Error:${ error.message } || Request:  || Metadata: ` );
        throw error;
        }
    }

    
    //INFO: Parsing pdmInfo into Facts for evaluating business rules 
    async findFactData2 ( rule:any, pdmInfo: any, lang_code, MetaData:MetaData) {
        
        let factRequest = new evalDto()
        factRequest.facts = []
        factRequest.ruleOperationType = rule.operation_type;
        factRequest.ruleId = rule.id;
        factRequest.lang_code=lang_code
        
        if(rule.dependent_attributes!==undefined) {
            
            //INFO: Parsing target attributes as facts too for validation rules
            if(rule.operation_type == 'mandatoryrules' || rule.operation_type == 'rangerules'){
                for(let i=0;i<rule.target_attributes.length;i++){
                    for(let j=0;j<pdmInfo.attribute_groups.length;j++){
                    if(pdmInfo.attribute_groups[j].attributes){
                        for(let k=0;k<pdmInfo.attribute_groups[j].attributes.length;k++){
                        if(rule.target_attributes[i] == pdmInfo.attribute_groups[j].attributes[k].attribute_db_name){
                            if(pdmInfo.attribute_groups[j].attributes[k].attribute_value == null){
                            
                            let facts = new fact();
                            facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                            facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                            facts.value = '';
                            factRequest.facts.push(facts)

                            } else {
                            //! TO CHECK FOR MULTISELECT
                            if(pdmInfo.attribute_groups[j].attributes[k].constraint == true){
                            for(let m=0;m<pdmInfo.attribute_groups[j].attributes[k].refrence_values.length;m++){
                                if(parseInt(pdmInfo.attribute_groups[j].attributes[k].attribute_value) == pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].id ){
                                    pdmInfo.attribute_groups[j].attributes[k].attribute_value = pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].id
                                }
                            }
                            } else {
                            let facts = new fact();
                            facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                            facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                            facts.value = pdmInfo.attribute_groups[j].attributes[k].attribute_value;
                            factRequest.facts.push(facts)
                            }

                            
                            }          
                        }
                        }
                    }
                    }
                }
            }
            
            for(let i=0;i<rule.dependent_attributes.length;i++){
                for(let j=0;j<pdmInfo.attribute_groups.length;j++){
                if(pdmInfo.attribute_groups[j].attributes){
                    for(let k=0;k<pdmInfo.attribute_groups[j].attributes.length;k++){
                        if(rule.dependent_attributes[i] == pdmInfo.attribute_groups[j].attributes[k].attribute_db_name){
                        
                        if(pdmInfo.attribute_groups[j].attributes[k].attribute_value == null){
                            let facts = new fact();
                            facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                            facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                            facts.value = '';
                            factRequest.facts.push(facts) 
                        } else {
                            if(pdmInfo.attribute_groups[j].attributes[k].constraint == true){
                            
                            if(pdmInfo.attribute_groups[j].attributes[k].attribute_type == "multiSelectDropdown"){
                                let factt = new fact();
                                factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                factt.value = pdmInfo.attribute_groups[j].attributes[k].attribute_value;                            
                                factRequest.facts.push(factt)
                            }else{
                                let flag = true;
                                for(let m=0;m<pdmInfo.attribute_groups[j].attributes[k].refrence_values.length;m++){
                                if(parseInt(pdmInfo.attribute_groups[j].attributes[k].attribute_value) ==pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].id ){
                                    flag = false;
                                    pdmInfo.attribute_groups[j].attributes[k].attribute_value = pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].id
                                    let factt = new fact();
                                    factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                    factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                    factt.value = pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].value;
                                    factRequest.facts.push(factt)
                                } 
                                else if ((pdmInfo.attribute_groups[j].attributes[k].attribute_value) ==pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].value ){
                                    flag = false;
                                    let factt = new fact();
                                    factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                    factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                    factt.value = pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].value;
                                    factRequest.facts.push(factt)
                                }
                                }

                                if(flag){
                                let factt = new fact();
                                factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                factt.value = "";
                                factRequest.facts.push(factt)
                                }
                            }
                            
                            } else { 
                            let facts = new fact();
                            facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                            facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                            facts.value = pdmInfo.attribute_groups[j].attributes[k].attribute_value;
                            factRequest.facts.push(facts)
                            }
                            
                        }
                        }
                    
                    }
                } 
                }
            }

        }

        return factRequest;
    }
    

    async findFactData ( rule:any, pdmInfo:any,lang_code, MetaData:MetaData, pricing:boolean, validationData:any) {
        
        
        try{
          
        //   this.logger.log(requestId, "Dependent Attributes : ", rule.dependent_attributes);
    
          let factRequest = new evalDto()
          factRequest.facts = []
          factRequest.ruleOperationType = rule.operation_type;
          factRequest.ruleId = rule.id;
          factRequest.lang_code=lang_code
        
          if(pricing){
            if(rule.operation_type == 'mandatoryrules' || rule.operation_type == 'rangerules'){

                
                if(rule.operation_type == 'mandatoryrules' || rule.operation_type == 'rangerules'){
                    for(let i=0;i<rule.target_attributes.length;i++){
                        for(let j=0;j<pdmInfo.data.length;j++){
                              if(rule.target_attributes[i] == pdmInfo.data[j].attribute_db_name){
                                
                                
                                
                                for(let l=0 ; l < validationData.length ; l++){
                                    
                                    if(validationData[l].attribute_db_name == rule.target_attributes[i]){
                                        
                                        if(validationData[l].attribute_value == null){
                                
                                            let facts = new fact();
                                            facts.attributeName = pdmInfo.data[j].attribute_db_name;
                                            facts.attributeType = pdmInfo.data[j].attribute_data_type;
                                            facts.value = {value : ''};
                                            factRequest.facts.push(facts)
                      
                                          } else {
                      
                                            if(pdmInfo.data[j].constraint == true){
                                              let facts = new fact();
                                              facts.attributeName = pdmInfo.data[j].attribute_db_name;
                                              facts.attributeType = pdmInfo.data[j].attribute_data_type;
                                              facts.value = ({value : validationData[l].attribute_value});
                                              factRequest.facts.push(facts)
                                            //   for(let m=0;m<pdmInfo.data[j].refrence_values.length;m++){
                                            //     // if(parseInt(pdmInfo.data[j].attribute_value) ==pdmInfo.data[j].refrence_values[m].id ){
                                            //       pdmInfo.data[j].attribute_value = pdmInfo.data[j].refrence_values[m].value
                                            //     // }
                                            //   }
                                            } else {
                                              let facts = new fact();
                                              facts.attributeName = pdmInfo.data[j].attribute_db_name;
                                              facts.attributeType = pdmInfo.data[j].attribute_data_type;
                                              facts.value = ({value : validationData[l].attribute_value});
                                              factRequest.facts.push(facts)
                                            }
                                          
                                          }  
                                    }
                                }
    
                                        
                              }
                            
                          
                        }
                    }
                  }
                  
                  if(rule.dependent_attributes!==undefined) {
                      
                      for(let i=0;i<rule.dependent_attributes.length;i++){
                          for(let j=0;j<pdmInfo.data.length;j++){
                                  if(rule.dependent_attributes[i] == pdmInfo.data[j].attribute_db_name){
                                    
                                    if(validationData.attribute_value == null){
                                        let facts = new fact();
                                        facts.attributeName = pdmInfo.data[j].attribute_db_name;
                                        facts.attributeType = pdmInfo.data[j].attribute_data_type;
                                        facts.value = ({value : ''});
                                        factRequest.facts.push(facts); 
                                    } else {
                                      if(pdmInfo.data[j].constraint == true){
                                        
                                        if(pdmInfo.data[j].attribute_type == "multiSelectDropdown"){
                                          let factt = new fact();
                                          factt.attributeName = pdmInfo.data[j].attribute_db_name;
                                          factt.attributeType = pdmInfo.data[j].attribute_data_type;
                                          factt.value = ({value : validationData.attribute_value});
                                          
                                          factRequest.facts.push(factt)
                                        }else{
                                        //   let flag = true;
                                        //   for(let m=0;m<pdmInfo.data[j].refrence_values.length;m++){
                                        //     if(parseInt(pdmInfo.data[j].attribute_value) ==pdmInfo.data[j].refrence_values[m].id ){
                                        //       flag = false;
                                        //       // attribute_group[j].attributes[k].attribute_value = attribute_group[j].attributes[k].refrence_values[m].value
                                        //       let factt = new fact();
                                        //       factt.attributeName = pdmInfo.data[j].attribute_db_name;
                                        //       factt.attributeType = pdmInfo.data[j].attribute_data_type;
                                        //       factt.value = ({value : pdmInfo.data[j].refrence_values[m].value});
                                        //       factRequest.facts.push(factt)
                                        //     } else if ((pdmInfo.data[j].attribute_value) ==pdmInfo.data[j].refrence_values[m].value ){
                                        //         flag = false;
                                        //         let factt = new fact();
                                        //         factt.attributeName = pdmInfo.data[j].attribute_db_name;
                                        //         factt.attributeType = pdmInfo.data[j].attribute_data_type;
                                        //         factt.value = ({value : pdmInfo.data[j].refrence_values[m].value});
                                        //         factRequest.facts.push(factt)
                                        //     }
                                        //   }
            
                                        //   if(flag){
                                            let factt = new fact();
                                            factt.attributeName = pdmInfo.data[j].attribute_db_name;
                                            factt.attributeType = pdmInfo.data[j].attribute_data_type;
                                            factt.value = ({value : validationData.attribute_value});
                                            factRequest.facts.push(factt)
                                        //   }
                                        }
                                        
                                      } else { 
                                        let facts = new fact();
                                        facts.attributeName = pdmInfo.data[j].attribute_db_name;
                                        facts.attributeType = pdmInfo.data[j].attribute_data_type;
                                        facts.value = ({value : pdmInfo.data[j].attribute_value});
                                        factRequest.facts.push(facts)
                                      }
                                        
                                    }
                                  
                            } 
                          }
                      }
            
                  }
              }else{
                  if(rule.dependent_attributes!==undefined) {
                      
                      for(let i=0;i<rule.dependent_attributes.length;i++){
                          for(let j=0;j<pdmInfo.data.length;j++){
                                  if(rule.dependent_attributes[i] == pdmInfo.data[j].attribute_db_name){
                                    
                                    if(pdmInfo.data[j].attribute_value == null){
                                        let facts = new fact();
                                        facts.attributeName = pdmInfo.data[j].attribute_db_name;
                                        facts.attributeType = pdmInfo.data[j].attribute_data_type;
                                        facts.value = ({value : ''});
                                        factRequest.facts.push(facts) 
                                    } else {
                                      if(pdmInfo.data[j].constraint == true){
                                        
                                        if(pdmInfo.data[j].attribute_type == "multiSelectDropdown"){
                                          let factt = new fact();
                                          factt.attributeName = pdmInfo.data[j].attribute_db_name;
                                          factt.attributeType = pdmInfo.data[j].attribute_data_type;
                                          factt.value = ({value : pdmInfo.data[j].attribute_value});
                                          
                                          factRequest.facts.push(factt)
                                        }else{
                                          let flag = true;
                                          for(let m=0;m<pdmInfo.data[j].refrence_values.length;m++){
                                            if(parseInt(pdmInfo.data[j].attribute_value) ==pdmInfo.data[j].refrence_values[m].id ){
                                              flag = false;
                                              // attribute_group[j].attributes[k].attribute_value = attribute_group[j].attributes[k].refrence_values[m].value
                                              let factt = new fact();
                                              factt.attributeName = pdmInfo.data[j].attribute_db_name;
                                              factt.attributeType = pdmInfo.data[j].attribute_data_type;
                                              factt.value = ({value : pdmInfo.data[j].refrence_values[m].value});
                                              factRequest.facts.push(factt)
                                            } else if ((pdmInfo.data[j].attribute_value) ==pdmInfo.data[j].refrence_values[m].value ){
                                                flag = false;
                                                let factt = new fact();
                                                factt.attributeName = pdmInfo.data[j].attribute_db_name;
                                                factt.attributeType = pdmInfo.data[j].attribute_data_type;
                                                factt.value = ({value : pdmInfo.data[j].refrence_values[m].value});
                                                factRequest.facts.push(factt)
                                            }
                                          }
            
                                          if(flag){
                                            let factt = new fact();
                                            factt.attributeName = pdmInfo.data[j].attribute_db_name;
                                            factt.attributeType = pdmInfo.data[j].attribute_data_type;
                                            factt.value = ({value : ""});
                                            factRequest.facts.push(factt)
                                          }
                                        }
                                        
                                      } else { 
                                        let facts = new fact();
                                        facts.attributeName = pdmInfo.data[j].attribute_db_name;
                                        facts.attributeType = pdmInfo.data[j].attribute_data_type;
                                        facts.value = ({value : pdmInfo.data[j].attribute_value});
                                        factRequest.facts.push(facts)
                                      }
                                        
                                    }
                                  }
                                
                              
                            
                          }
                      }
            
                  }
              }
          } else {
          if(rule.operation_type == 'mandatoryrules' || rule.operation_type == 'rangerules'){

            
            if(rule.operation_type == 'mandatoryrules' || rule.operation_type == 'rangerules'){
                for(let i=0;i<rule.target_attributes.length;i++){
                    for(let j=0;j<pdmInfo.attribute_groups.length;j++){
                      if(pdmInfo.attribute_groups[j].attributes){
                        for(let k=0;k<pdmInfo.attribute_groups[j].attributes.length;k++){
                          if(rule.target_attributes[i] == pdmInfo.attribute_groups[j].attributes[k].attribute_db_name){
                            
                            
                            
                            for(let l=0 ; l < validationData.length ; l++){
                                
                                if(validationData[l].attribute_db_name == rule.target_attributes[i]){
                                    
                                    if(validationData[l].attribute_value == null){
                            
                                        let facts = new fact();
                                        facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                        facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                        facts.value = {value : ''};
                                        factRequest.facts.push(facts)
                  
                                      } else {
                  
                                        if(pdmInfo.attribute_groups[j].attributes[k].constraint == true){
                                          let facts = new fact();
                                          facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                          facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                          facts.value = ({value : validationData[l].attribute_value});
                                          factRequest.facts.push(facts)
                                        //   for(let m=0;m<pdmInfo.attribute_groups[j].attributes[k].refrence_values.length;m++){
                                        //     // if(parseInt(pdmInfo.attribute_groups[j].attributes[k].attribute_value) ==pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].id ){
                                        //       pdmInfo.attribute_groups[j].attributes[k].attribute_value = pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].value
                                        //     // }
                                        //   }
                                        } else {
                                          let facts = new fact();
                                          facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                          facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                          facts.value = ({value : validationData[l].attribute_value});
                                          factRequest.facts.push(facts)
                                        }
                                      
                                      }  
                                }
                            }

                                    
                          }
                        }
                      }
                    }
                }
              }
              
              if(rule.dependent_attributes!==undefined) {
                  
                  for(let i=0;i<rule.dependent_attributes.length;i++){
                      for(let j=0;j<pdmInfo.attribute_groups.length;j++){
                        if(pdmInfo.attribute_groups[j].attributes){
                          for(let k=0;k<pdmInfo.attribute_groups[j].attributes.length;k++){
                              if(rule.dependent_attributes[i] == pdmInfo.attribute_groups[j].attributes[k].attribute_db_name){
                                
                                if(validationData.attribute_value == null){
                                    let facts = new fact();
                                    facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                    facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                    facts.value = ({value : ''});
                                    factRequest.facts.push(facts); 
                                } else {
                                  if(pdmInfo.attribute_groups[j].attributes[k].constraint == true){
                                    
                                    if(pdmInfo.attribute_groups[j].attributes[k].attribute_type == "multiSelectDropdown"){
                                      let factt = new fact();
                                      factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                      factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                      factt.value = ({value : validationData.attribute_value});
                                      
                                      factRequest.facts.push(factt)
                                    }else{
                                    //   let flag = true;
                                    //   for(let m=0;m<pdmInfo.attribute_groups[j].attributes[k].refrence_values.length;m++){
                                    //     if(parseInt(pdmInfo.attribute_groups[j].attributes[k].attribute_value) ==pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].id ){
                                    //       flag = false;
                                    //       // attribute_group[j].attributes[k].attribute_value = attribute_group[j].attributes[k].refrence_values[m].value
                                    //       let factt = new fact();
                                    //       factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                    //       factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                    //       factt.value = ({value : pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].value});
                                    //       factRequest.facts.push(factt)
                                    //     } else if ((pdmInfo.attribute_groups[j].attributes[k].attribute_value) ==pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].value ){
                                    //         flag = false;
                                    //         let factt = new fact();
                                    //         factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                    //         factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                    //         factt.value = ({value : pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].value});
                                    //         factRequest.facts.push(factt)
                                    //     }
                                    //   }
        
                                    //   if(flag){
                                        let factt = new fact();
                                        factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                        factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                        factt.value = ({value : validationData.attribute_value});
                                        factRequest.facts.push(factt)
                                    //   }
                                    }
                                    
                                  } else { 
                                    let facts = new fact();
                                    facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                    facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                    facts.value = ({value : pdmInfo.attribute_groups[j].attributes[k].attribute_value});
                                    factRequest.facts.push(facts)
                                  }
                                    
                                }
                              }
                            
                          }
                        } 
                      }
                  }
        
              }
          }else{
              
              if(rule.dependent_attributes!==undefined) {
                  
                  for(let i=0;i<rule.dependent_attributes.length;i++){
                      for(let j=0;j<pdmInfo.attribute_groups.length;j++){
                        if(pdmInfo.attribute_groups[j].attributes){
                          for(let k=0;k<pdmInfo.attribute_groups[j].attributes.length;k++){
                              if(rule.dependent_attributes[i] == pdmInfo.attribute_groups[j].attributes[k].attribute_db_name){
                                
                                if(pdmInfo.attribute_groups[j].attributes[k].attribute_value == null){
                                    let facts = new fact();
                                    facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                    facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                    facts.value = ({value : ''});
                                    factRequest.facts.push(facts) 
                                } else {
                                  if(pdmInfo.attribute_groups[j].attributes[k].constraint == true){
                                    
                                    if(pdmInfo.attribute_groups[j].attributes[k].attribute_type == "multiSelectDropdown"){
                                      let factt = new fact();
                                      factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                      factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                      factt.value = ({value : pdmInfo.attribute_groups[j].attributes[k].attribute_value});
                                      
                                      factRequest.facts.push(factt)
                                    }else{
                                      let flag = true;
                                      for(let m=0;m<pdmInfo.attribute_groups[j].attributes[k].refrence_values.length;m++){
                                        if(parseInt(pdmInfo.attribute_groups[j].attributes[k].attribute_value) ==pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].id ){
                                          flag = false;
                                          // attribute_group[j].attributes[k].attribute_value = attribute_group[j].attributes[k].refrence_values[m].value
                                          let factt = new fact();
                                          factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                          factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                          factt.value = ({value : pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].value});
                                          factRequest.facts.push(factt)
                                        } else if ((pdmInfo.attribute_groups[j].attributes[k].attribute_value) ==pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].value ){
                                            flag = false;
                                            let factt = new fact();
                                            factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                            factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                            factt.value = ({value : pdmInfo.attribute_groups[j].attributes[k].refrence_values[m].value});
                                            factRequest.facts.push(factt)
                                        }
                                      }
        
                                      if(flag){
                                        let factt = new fact();
                                        factt.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                        factt.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                        factt.value = ({value : ""});
                                        factRequest.facts.push(factt)
                                      }
                                    }
                                    
                                  } else { 
                                    let facts = new fact();
                                    facts.attributeName = pdmInfo.attribute_groups[j].attributes[k].attribute_db_name;
                                    facts.attributeType = pdmInfo.attribute_groups[j].attributes[k].attribute_data_type;
                                    facts.value = ({value : pdmInfo.attribute_groups[j].attributes[k].attribute_value});
                                    factRequest.facts.push(facts)
                                  }
                                    
                                }
                              }
                            
                          }
                        } 
                      }
                  }
        
              }
          }
        }
    
          return factRequest;
        }catch(error){
        //   this.logger.error(requestId, error, "Error occured and was caught in Catch Block ( Find Fact Data )");
        }
        
        
        // ! DO NOT REMOVE THIS COMMENTED PART 
        // else{
        //     for(let j=0;j<pdmInfoGroup.length;j++){
        //       if(pdmInfoGroup[j].attributes){
        //         for(let k=0;k<pdmInfoGroup[j].attributes.length;k++){
        //             if(pdmInfoGroup[j].attributes[k].attribute_value == null){
        //                 let facts = new fact();
        //                 facts.attributeName = pdmInfoGroup[j].attributes[k].attribute_db_name;
        //                 facts.attributeType = pdmInfoGroup[j].attributes[k].attribute_data_type;
        //                 facts.value = '';
        //                 factRequest.facts.push(facts) 
        //             } else {
        //               if(pdmInfoGroup[j].attributes[k].constraint == true){
        //                 for(let m=0;m<pdmInfoGroup[j].attributes[k].refrence_values.length;m++){
        //                   if(parseInt(pdmInfoGroup[j].attributes[k].attribute_value) ==pdmInfoGroup[j].attributes[k].refrence_values[m].id ){
        //                     pdmInfoGroup[j].attributes[k].attribute_value = pdmInfoGroup[j].attributes[k].refrence_values[m].value
        //                     let facts = new fact();
        //                     facts.attributeName = pdmInfoGroup[j].attributes[k].attribute_db_name;
        //                     facts.attributeType = pdmInfoGroup[j].attributes[k].attribute_data_type;
        //                     facts.value = pdmInfoGroup[j].attributes[k].attribute_value;
        //                     factRequest.facts.push(facts)
        //                   }
        //                 }
    
    
        //               } else { 
        //                 let facts = new fact();
        //                 facts.attributeName = pdmInfoGroup[j].attributes[k].attribute_db_name;
        //                 facts.attributeType = pdmInfoGroup[j].attributes[k].attribute_data_type;
        //                 facts.value = pdmInfoGroup[j].attributes[k].attribute_value;
        //                 factRequest.facts.push(facts);
        //               }      
        //             }
        //         }
        //       } 
        //     }
        // }
        
      }

    //INFO: Creating Metadata Constructor and returning  
    async addMetadata(metaData: MetaData): Promise<Metadata> {

        const metadata = new Metadata();

        metadata.add('tenant_id', metaData.tenant_id);
        metadata.add('user_id', metaData.user_id);
        metadata.add('org_id', metaData.org_id);        
        return metadata;
    }

    //INFO: This function is for sending the response in the required format
    async responseObject(status:string, message:string, data:any){
        return {
            status:status,
            message:message,
            data:data
        }
    }

    //?---------------------------DEPRECATED-15-NOVEMBER---------------------------
  //   async filterRules(
//     categoryId: number,
//     pdmId: number,
//     metaData: MetaData,
//     lang_code: string,
//     target_only: boolean,
//     rule_type: string,
//     pdmInfo: any,
//   ) {
//     const metadata = await this.addMetadata(metaData);

//     // INFO : This Will give the rules on perticular category based on ruletype = filter (only Dependent and Independent Rule)
//     const res = await this.getRuleForCategory(
//       { id: categoryId, type: rule_type, rule_type: 'governance_rules' },
//       metaData,
//     );
//     // pdmInformation = pdmInfo;



//     if (
//       res.data === undefined ||
//       res.data.length === 0 ||
//       res.data[0].target_attributes === undefined ||
//       res.data[0].target_attributes.length === 0
//     )
//       return pdmInfo;
//     rules = res.data;



//     let variantAttribute = [];
//     if (pdmInformation.is_variant) {

//       for (let i = 0; i < pdmInformation.attribute_groups.length; i++) {
//         // INFO : id = 120 for Variations (Default Group by PIM)

//         if (pdmInformation.attribute_groups[i].id == 120) {
//           for (
//             let j = 0;
//             j < pdmInformation.attribute_groups[i].attributes.length;
//             j++
//           ) {
//             variantAttribute.push(
//               pdmInformation.attribute_groups[i].attributes[j]
//                 .attribute_db_name,
//             );
//           }
//         }
//       }

//       for (let i = rules.length - 1; i >= 0; i--) {
//         for (let j = 0; j < variantAttribute.length; j++) {
//           let flag = false;
//           if (
//             rules[i].dependent_attributes.includes(variantAttribute[j]) ||
//             rules[i].target_attributes.includes(variantAttribute[j])
//           ) {
//             flag = true;
//             rules.splice(i, 1);
//           }
//           if (flag) {
//             break;
//           }
//         }
//       }

//     }

//     const respo = await this.getAttributesByCategory(
//       categoryId,
//       lang_code,
//       metaData,
//     );
//     attributeData = respo.data;

//     for (let i = 0; i < rules.length; i++) {
//       rules[i]['flag'] = false;
//     }

//     const getDependentTargetRequest = {
//       category_id: categoryId,
//       type: rule_type,
//       target_only: target_only,
//       rule_type: 'governance_rules',
//     };
//     const resp = await this.getDependentTarget(
//       getDependentTargetRequest,
//       metaData,
//     );
//     dependent_attributes = resp.data.dependent_attributes;
//     target_attributes = resp.data.target_attributes;


//     await this.evaluateRule(
//       categoryId,
//       pdmId,
//       metaData,
//       rules,
//       lang_code,
//       'governance_rules',
//       pdmInfo,
//       undefined,
//     );
//     return pdmInfo;
//   }

  async getcolumnvalue(categoryId: number, pdmId: number, metaData: MetaData) {
    const tableName = `product_data`
    const a = await this.pdmReaderDataSource.manager.query(
      `SELECT
        column_name,data_type
        FROM
        information_schema.columns
        WHERE
        table_name = $1`,
      [tableName],
    );

    const values = await this.pdmReaderDataSource.manager.query(
      `select * from ${tableName} where pdm_id=$1`,
      [pdmId],
    );

    for (let x of a) {
      x['value'] = values[0][`${x.column_name}`];
    }

    return a;
  }

  //find the rule by it's name from rules array
  

  // ! DO Not Remove
  // INFO : Data governance old findFactData
  // async findFactData ( rule:any,lang_code,MetaData:MetaData) {


  //     try{
  //         let factRequest = new evalDto()
  //         factRequest.facts = []
  //         factRequest.ruleOperationType = rule.operation_type;
  //         factRequest.ruleId = rule.id;
  //         factRequest.lang_code=lang_code
  //         let parsedValues = await this.parseAttribute(attributeData)

  //         if(rule.dependent_attributes!==undefined){
  //             if(rule.operation_type == 'mandatoryrules' || rule.operation_type == 'rangerules'){
  //                 for(let i=0;i<rule.target_attributes.length;i++){
  //                     for(let j=0;j<pdmData.length;j++){
  //                         if(rule.target_attributes[i] == pdmData[j].column_name){
  //                             console.log("pdmData.value : ", pdmData[j]);

  //                             if(pdmData[j].value == null ){
  //                                 let facts = new fact();
  //                                 facts.attributeName = pdmData[j].column_name;
  //                                 facts.attributeType = pdmData[j].data_type;
  //                                 facts.value = '';
  //                                 factRequest.facts.push(facts)

  //                             } else {

  //                                 //! ------------------------------------------------------------------------------------------------
  //                                 for (let n=0;n<parsedValues.length;n++){
  //                                     if(pdmData[j].column_name == parsedValues[n].attribute_db_name){
  //                                         console.log("parsedValues[n].constraint  : ", parsedValues[n].constraint );

  //                                         if(parsedValues[n].constraint === true){
  //                                             // let metadata = new Metadata();
  //                                             // metadata.add('tenant_id',MetaData['tenant_id'])
  //                                             // metadata.add('org_id',MetaData['org_id'])
  //                                             // metadata.add('user_id',MetaData['user_id'])
  //                                             // let refData = await this.attributeService.getReferenceData({ id:parsedValues[n].reference_attribute_id, reference_master_id:parsedValues[n].reference_master_id ,lang_code:lang_code },metadata);
  //                                             // let referenceData = await refData.toPromise();
  //                                             const getReferenceDataRequest = { id:parsedValues[n].reference_attribute_id, reference_master_id:parsedValues[n].reference_master_id ,lang_code:lang_code }
  //                                             const referenceData = await this.getReferenceData(getReferenceDataRequest, MetaData)

  //                                             console.log("--selected value--");

  //                                             console.log(pdmData[j]);

  //                                             if(parsedValues[n].attribute_type == "multiSelectDropdown"){
  //                                                 // pdmData[j].value = referenceData.data;
  //                                             }else{
  //                                                 for(let m=0;m<referenceData.data.length;m++){
  //                                                     if(parseInt(pdmData[j].value) == referenceData.data[m].id ){
  //                                                         pdmData[j].value = referenceData.data[m].value;
  //                                                     }
  //                                                 }
  //                                             }

  //                                             console.log("----------- Final * Final ----------");
  //                                             console.log(pdmData[j].value);

  //                                             let facts = new fact();
  //                                             facts.attributeName = pdmData[j].column_name;
  //                                             facts.attributeType = pdmData[j].data_type;
  //                                             facts.value = pdmData[j].value;
  //                                             factRequest.facts.push(facts)
  //                                         } else {
  //                                             let facts = new fact();
  //                                             facts.attributeName = pdmData[j].column_name;
  //                                             facts.attributeType = pdmData[j].data_type;
  //                                             facts.value = pdmData[j].value;
  //                                             factRequest.facts.push(facts)
  //                                         }
  //                                     }

  //                                 }

  //                             }

  //                         }
  //                     }
  //                 }
  //             }

  //             for(let i=0;i<rule.dependent_attributes.length;i++){
  //                 for(let j=0;j<pdmData.length;j++){

  //                     if(rule.dependent_attributes[i] == pdmData[j].column_name){
  //                         if(pdmData[j].value == null){
  //                             let facts = new fact();
  //                             facts.attributeName = pdmData[j].column_name;
  //                             facts.attributeType = pdmData[j].data_type;
  //                             facts.value = '';
  //                             factRequest.facts.push(facts)
  //                         } else {
  //                             for (let n=0;n<parsedValues.length;n++){
  //                                 if(pdmData[j].column_name == parsedValues[n].attribute_db_name){
  //                                     if(parsedValues[n].constraint === true){
  //                                         let metadata = new Metadata();
  //                                         metadata.add('tenant_id',MetaData['tenant_id'])
  //                                         metadata.add('org_id',MetaData['org_id'])
  //                                         metadata.add('user_id',MetaData['user_id'])
  //                                         const getReferenceDataRequest = { id:parsedValues[n].reference_attribute_id, reference_master_id:parsedValues[n].reference_master_id ,lang_code:lang_code }
  //                                         // let refData = await this.attributeService.getReferenceData({ id:parsedValues[n].reference_attribute_id, reference_master_id:parsedValues[n].reference_master_id ,lang_code:lang_code },metadata);
  //                                         // let referenceData = await refData.toPromise();
  //                                         const referenceData = await this.getReferenceData(getReferenceDataRequest, MetaData)

  //                                         if(parsedValues[n].attribute_type == "multiSelectDropdown"){
  //                                             console.log("-----thjk----");
  //                                             console.log(parsedValues[n]);
  //                                             console.log("-----thjk----");

  //                                             // pdmData[j].value = referenceData.data;
  //                                         }else{
  //                                             for(let m=0;m<referenceData.data.length;m++){
  //                                                 if(parseInt(pdmData[j].value) == referenceData.data[m].id ){
  //                                                     pdmData[j].value = referenceData.data[m].value;
  //                                                 }
  //                                             }
  //                                         }

  //                                         let facts = new fact();
  //                                         facts.attributeName = pdmData[j].column_name;
  //                                         facts.attributeType = pdmData[j].data_type;
  //                                         facts.value = pdmData[j].value;
  //                                         factRequest.facts.push(facts)
  //                                     } else {
  //                                         let facts = new fact();
  //                                         facts.attributeName = pdmData[j].column_name;
  //                                         facts.attributeType = pdmData[j].data_type;
  //                                         facts.value = pdmData[j].value;
  //                                         factRequest.facts.push(facts)
  //                                     }
  //                                 }

  //                             }
  //                         }

  //                     }
  //                 }
  //             }
  //         }else{
  //             for(let j=0;j<pdmData.length;j++){
  //                 if(pdmData[j].value == null){
  //                     let facts = new fact();
  //                     facts.attributeName = pdmData[j].column_name;
  //                     facts.attributeType = pdmData[j].data_type;
  //                     facts.value = '';
  //                     factRequest.facts.push(facts)
  //                 }else{
  //                     for (let n=0;n<parsedValues.length;n++){
  //                         if(pdmData[j].column_name == parsedValues[n].attribute_db_name){
  //                             if(parsedValues[n].constraint === true){
  //                                 // let metadata = new Metadata();
  //                                 //                         metadata.add('tenant_id',MetaData['tenant_id']);
  //                                 //                         metadata.add('org_id',MetaData['org_id']);
  //                                 //                         metadata.add('user_id',MetaData['user_id']);
  //                                 // let refData = await this.attributeService.getReferenceData({ id:parsedValues[n].reference_attribute_id, reference_master_id:parsedValues[n].reference_master_id ,lang_code:lang_code },metadata);
  //                                 // let referenceData = await refData.toPromise();
  //                                 const getReferenceDataRequest = { id:parsedValues[n].reference_attribute_id, reference_master_id:parsedValues[n].reference_master_id ,lang_code:lang_code }
  //                                 const referenceData = await this.getReferenceData(getReferenceDataRequest, MetaData)
  //                                 for(let m=0;m<referenceData.data.length;m++){
  //                                     if(parseInt(pdmData[j].value) == referenceData.data[m].id ){
  //                                         pdmData[j].value = referenceData.data[m].value;
  //                                     }
  //                                 }
  //                                 let facts = new fact();
  //                                 facts.attributeName = pdmData[j].column_name;
  //                                 facts.attributeType = pdmData[j].data_type;
  //                                 facts.value = pdmData[j].value;
  //                                 factRequest.facts.push(facts)
  //                             } else {
  //                                 let facts = new fact();
  //                                 facts.attributeName = pdmData[j].column_name;
  //                                 facts.attributeType = pdmData[j].data_type;
  //                                 facts.value = pdmData[j].value;
  //                                 factRequest.facts.push(facts)
  //                             }
  //                         }

  //                     }
  //                 }
  //             }
  //         }

  //         return factRequest;
  //     } catch(err){
  //         console.log(err)
  //     }

  // }

  //   async parseAttribute(values: any) {
//     for (let j = 0; j < values.length; j++) {
//       for (let i = 0; i < attributeData.length; i++) {
//         if (attributeData[i].attribute_db_name === values[j].targetAttribute) {
//           switch (attributeData[i].attribute_data_type) {
//             case 'boolean': {
//               values[j].value = values[j].value === 'true';
//               break;
//             }
//             case 'boolean[]': {
//               values[j].value = JSON.parse(values[j].value);
//               for (let y of values[j].value) {
//                 y = y == 'true';
//               }
//               break;
//             }
//             case 'time with time zone' || 'timestamptz' || 'date': {
//               values[j].value = new Date(values[j].value);
//               break;
//             }
//             case 'time with time zone[]' || 'timestamptz[]' || 'date[]': {
//               values[j].value = JSON.parse(values[j].value);
//               for (let y of values[j].value) {
//                 y = new Date(y);
//               }
//               break;
//             }
//             case 'int': {
//               values[j].value = values[j].value.replaceAll(',', '');
//               values[j].value = parseInt(values[j].value);

//               if (values[j].value > attributeData[i].length)
//                 throw new HttpException(
//                   `Length of ${attributeData[i].attribute_db_name} must be less than ${attributeData[i].length}`,
//                   409,
//                 );
//               break;
//             }
//             case 'int[]': {
//               let n = '';
//               if (typeof values[j].value !== 'object') {
//                 values[j].value = [values[j].value];
//               }
//               for (let y = 0; y < values[j].value.length; y++) {
//                 if (values[j].value[y].length > attributeData[i].length) {
//                   throw new HttpException(
//                     `Length of ${attributeData[i].attribute_db_name} must be less than ${attributeData[i].length}`,
//                     409,
//                   );
//                   break;
//                 } else {
//                   if (values[j].value.length == 1) {
//                     n = 'ARRAY[';
//                     n += `${values[j].value[y]}`;
//                     n += ']';
//                     values[j].value = n;
//                     break;
//                   } else {
//                     if (y == 0) {
//                       n = 'ARRAY[';
//                       n += `${values[j].value[y]}`;
//                     } else {
//                       if (y == values[j].value.length - 1) {
//                         n += `${values[j].value[y]}`;
//                         n += ']';
//                         // console.log(n);
//                         values[j].value = n;
//                         // console.log(values[j].value);
//                       } else {
//                         n += `${values[j].value[y]}`;
//                       }
//                     }
//                   }
//                 }
//               }
//             }
//             case 'float': {
//               values[j].value = parseFloat(values[j].value);
//               values[j].value = values[j].value.replaceAll(',', '');

//               if (values[j].value > attributeData[i].length)
//                 throw new HttpException(
//                   `Length of ${attributeData[i].attribute_db_name} must be less than ${attributeData[i].length}`,
//                   409,
//                 );
//               break;
//             }
//             case 'float[]': {
//               let n = '';
//               if (typeof values[j].value !== 'object') {
//                 values[j].value = [values[j].value];
//               }
//               for (let y = 0; y < values[j].value.length; y++) {
//                 if (values[j].value[y].length > attributeData[i].length) {
//                   throw new HttpException(
//                     `Length of ${attributeData[i].attribute_db_name} must be less than ${attributeData[i].length}`,
//                     409,
//                   );
//                   break;
//                 } else {
//                   if (values[j].value.length == 1) {
//                     n = 'ARRAY[';
//                     n += `${values[j].value[y]}`;
//                     n += ']';
//                     values[j].value = n;
//                     break;
//                   } else {
//                     if (y == 0) {
//                       n = 'ARRAY[';
//                       n += `${values[j].value[y]}`;
//                     } else {
//                       if (y == values[j].value.length - 1) {
//                         n += `${values[j].value[y]}`;
//                         n += ']';
//                         // console.log(n);
//                         values[j].value = n;
//                         // console.log(values[j].value);
//                       } else {
//                         n += `${values[j].value[y]}`;
//                       }
//                     }
//                   }
//                 }
//               }
//             }
//             case 'varchar': {
//               values[j].value = values[j].value.toString();
//               if (values[j].value.length > attributeData[i].length)
//                 throw new HttpException(
//                   `Length of ${attributeData[i].attribute_db_name} must be less than ${attributeData[i].length}`,
//                   409,
//                 );
//               break;
//             }
//             case 'varchar[]': {
//               let n = '';
//               if (typeof values[j].value !== 'object') {
//                 values[j].value = [values[j].value];
//               }
//               for (let y = 0; y < values[j].value.length; y++) {
//                 if (values[j].value[y].length > attributeData[i].length) {
//                   throw new HttpException(
//                     `Length of ${attributeData[i].attribute_db_name} must be less than ${attributeData[i].length}`,
//                     409,
//                   );
//                   break;
//                 } else {
//                   if (attributeData[i].constraint === true) {
//                     if (values[j].value.length === 1) {
//                       n = 'ARRAY[';
//                       n += `${values[j].value[y]}`;
//                       n += ']';
//                       values[j].value = n;
//                       break;
//                     } else {
//                       if (y == 0) {
//                         n = 'ARRAY[';
//                         n += `${values[j].value[y]}`;
//                       } else {
//                         if (y == values[j].value.length - 1) {
//                           n += `${values[j].value[y]}`;
//                           n += ']';
//                           // console.log("parseAttribute")
//                           // console.log(n);
//                           values[j].value = n;
//                           // console.log(values[j].value);
//                         } else {
//                           n += `${values[j].value[y]}`;
//                         }
//                       }
//                     }
//                   } else {
//                     if (values[j].value.length == 1) {
//                       n = 'ARRAY[';
//                       n += `'${values[j].value[y]}'`;
//                       n += ']';
//                       values[j].value = n;
//                     }
//                     if (y == 0) {
//                       n = 'ARRAY[';
//                       n += `'${values[j].value[y]}'`;
//                     } else {
//                       if (y == values[j].value.length - 1) {
//                         n += `'${values[j].value[y]}'`;
//                         n += ']';
//                         // console.log(n);
//                         values[j].value = n;
//                         // console.log(values[j].value);
//                       } else {
//                         n += `'${values[j].value[y]}'`;
//                       }
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     }
//     // console.log("--------------------------------VALUES--------------------------------")
//     // console.log(values)
//     // console.log("--------------------------------VALUES--------------------------------")
//     return values;
//   }

  //INFO: This function is for fetching the metadata required for a gRPC call  
    // async parsePdmInfo(categoryId: number, pdmId: number, savevalue: any, metaData:MetaData){
  //     try {
  //         console.log("-----------------------------------------------PDM INFO Data-----------------------------------------------------")
  //         console.log( savevalue.data[0])

  //         for (let i = 0; i < pdmInfo.attribute_groups.length;i++){
  //             if(pdmInfo.attribute_groups[i].attributes){
  //                 for (let j=0; j<pdmInfo.attribute_groups[i].attributes.length;j++){
  //                     let filterIds = [];

  //                     if(pdmInfo.attribute_groups[i].attributes[j].attribute_db_name == savevalue.data[0].targetAttribute){
  //                         (pdmInfo.attribute_groups[i].attributes[j])["attr_block"] = false;
  //                         (pdmInfo.attribute_groups[i].attributes[j])["refrence_values"] = [];

  //                         if((pdmInfo.attribute_groups[i].attributes[j])["attribute_type"] !=  "multiSelectDropdown"){
  //                             ((pdmInfo.attribute_groups[i].attributes[j])["refrence_values"]).push({ id:0,value:"Select" })
  //                         }

  //                         for(let k=0;k<savevalue.data[0].data_to_filter.length;k++){
  //                             ((pdmInfo.attribute_groups[i].attributes[j])["refrence_values"]).push({
  //                                 id:savevalue.data[0].data_to_filter[k].id,
  //                                 value:savevalue.data[0].data_to_filter[k].value
  //                             })
  //                             filterIds.push(savevalue.data[0].data_to_filter[k].id);
  //                         }

  //                         if((pdmInfo[i].attributes[j])['attribute_value'] != null || (pdmInfo[i].attributes[j])['attribute_value'] != undefined){
  //                             for(let p=0 ; p<(pdmInfo[i].attributes[j])['attribute_value'].length ; p++){
  //                                 let curr = (pdmInfo[i].attributes[j])['attribute_value'][p].id
  //                                 if(!filterIds.includes(curr)){
  //                                   (pdmInfo[i].attributes[j])['attribute_value'] = [];
  //                                   return;
  //                                 }

  //                               }
  //                         }
  //                     }
  //                 }
  //             }

  //         }
  //     } catch(error){
  //         console.log(error);
  //     }
  // }

  //?---------------------------DEPRECATED-15-NOVEMBER---------------------------


}

