import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"

export type SAPMappingType = 'price' | 'product' | 'category' | 'store_codes' | 'price_batch_size'

@Entity()
export class SAPMapping{
    @PrimaryColumn({
		type: "enum",
		enum: ["price", "product", "category", "store_codes", "price_batch_size"],
    })
    type:SAPMappingType

    @PrimaryColumn()
    pim_attribute:string

    @Column()
    sap_attribute:string

}

@Entity()
export class UomConversionMetrics{

    @PrimaryGeneratedColumn()
    id:number

    @Column()
    uom_type:string

    @Column('character varying',{array:true})
    values:string[]

    @Column({type:'numeric'})
    conversion_multiplier:number
}

@Entity()
export class ProductPrice{

    @PrimaryColumn()
    channel_id:number

    @PrimaryColumn()
    location_id:number

    @PrimaryColumn()
    pdm_id:number

    @PrimaryColumn()
    category_id:number

    @PrimaryColumn()
    tenant_id:string

    @PrimaryColumn()
    org_id:string

    @Column({nullable:true})
    price_push_status?:string

    @Column({type:'jsonb'})
    price:Object

    @Column({type: "timestamptz", nullable:true, default:()=>"CURRENT_TIMESTAMP(6)"})
    updated_at:Date

    @Column({nullable:true})
    user_action_id:string

    @Column({nullable:true})
    business_rule_id:string

    @Column({nullable:true})
    user_id:string

    @Column({nullable:true})
    source:string

    @Column({default:false})
    shopify_sync:boolean

    @Column({default:false})
    eretail_sync:boolean

}

@Entity()
export class PriceUomCalculationMetadata{

    @PrimaryColumn()
    category_id:number

	@Column('character varying', {array:true, nullable:true})
    price_attributes:string[]

    @Column('character varying', {array:true, nullable:true})
    copy_attributes:string[]

    @PrimaryColumn()
    uom_attribute:string

    @PrimaryColumn()
    variant_attribute:string

    @PrimaryColumn()
    tenant_id:string

    @PrimaryColumn()
    org_id:string
}

@Entity()
export class ProductData{
    @PrimaryGeneratedColumn()
	pdm_id?:number

	@PrimaryColumn()
	category_id:number

	@PrimaryColumn()
	tenant_id:string

	@PrimaryColumn()
	org_id:string

    @Column({nullable:true})
    parent_pdm_id:number

    @Column({type:'jsonb'})
    product_data:Object
}

@Entity()
export class ProductMetadata{
    // @Column()
	@PrimaryColumn()
	pdm_id:number

    // @Column()
	@PrimaryColumn()
	category_id:number

    // @Column()
	@PrimaryColumn()
	tenant_id:string

    // @Column()
	@PrimaryColumn()
	org_id:string

	@Column({nullable:true})
	color_variant?:number

	@Column({nullable:true})
	size_variant?:number

	@Column('int', {array:true, nullable:true})
	other_variant:number[]
	
	@Column({default:true})
	variant_published?:boolean

    @Column({nullable:true})
	price_reference?:boolean

	@Column({nullable:true})
	parent_pdm_id?:number

	@Column({default:true})
	status?:boolean

	@Column()
	classification:string

    @Column({nullable:true, default:0})
    completion_percentage?:number

    @Column({nullable:true, default:0})
    variant_count?:number

    @Column({default:false})
    variant_deleted?:boolean

    @Column({type:'jsonb', default:{}})
    auto_translated?:Object

    @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP(6)" })
    created_at?: Date

    @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    updated_at?: Date

}