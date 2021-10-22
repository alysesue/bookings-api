import {
	ChildEntity,
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	TableInheritance,
	DeleteDateColumn,
} from 'typeorm';
import { MyInfoFieldType } from './myInfoFieldType';
import { Service } from './service';

export interface IDynamicFieldVisitor {
	visitSelectList(_selectListField: SelectListDynamicField): void;
	visitTextField(_textField: TextDynamicField): void;
	visitMyInfo(_myInfoDynamicField: MyInfoDynamicField): void;
	visitDateOnlyField(_dateOnlyField: DateOnlyDynamicField): void;
}

export interface IDynamicFieldVisitorAsync {
	visitSelectList(_selectListField: SelectListDynamicField): Promise<void>;
	visitTextField(_textField: TextDynamicField): Promise<void>;
	visitMyInfo(_myInfoDynamicField: MyInfoDynamicField): Promise<void>;
	visitDateOnlyField(_dateOnlyField: DateOnlyDynamicField): Promise<void>;
}

/**
 * IMPORTANT: Make sure you export all CHILD entites in entities/index.ts
 */
export enum DynamicFieldEntityType {
	SelectListDynamicFieldType = 'SelectListDynamicField',
	TextDynamicFieldType = 'TextDynamicField',
	DateOnlyDynamicField = 'DateOnlyDynamicField',
	MyInfoDynamicFieldType = 'MyInfoDynamicFieldType',
}

@Entity()
@TableInheritance({ column: { type: 'enum', enum: DynamicFieldEntityType, name: '_type' } })
export abstract class DynamicField {
	constructor() {}

	@PrimaryGeneratedColumn()
	private _id: number;

	public get id(): number {
		return this._id;
	}

	public set id(id: number) {
		this._id = id;
	}

	@DeleteDateColumn()
	private _deletedAt?: Date;

	public get deletedAt(): Date | undefined {
		return this._deletedAt;
	}

	@Column({ nullable: false })
	@Index()
	private _serviceId: number;

	public get serviceId(): number {
		return this._serviceId;
	}

	public set serviceId(value: number) {
		this._serviceId = value;
	}

	@ManyToOne(() => Service)
	@JoinColumn({ name: '_serviceId' })
	private _service: Service;

	public set service(service: Service) {
		this._service = service;
	}
	public get service(): Service {
		return this._service;
	}

	@Column({ nullable: false })
	private _name: string;

	public get name(): string {
		return this._name;
	}

	public set name(value: string) {
		this._name = value;
	}

	@Column({ nullable: false, default: false })
	private _isMandatory: boolean;

	public get isMandatory(): boolean {
		return this._isMandatory;
	}

	public set isMandatory(value: boolean) {
		this._isMandatory = value;
	}

	public abstract acceptVisitor(visitor: IDynamicFieldVisitor): void;
	public abstract acceptVisitorAsync(visitor: IDynamicFieldVisitorAsync): Promise<void>;
}

@ChildEntity(DynamicFieldEntityType.MyInfoDynamicFieldType)
export class MyInfoDynamicField extends DynamicField {
	constructor() {
		super();
	}

	@Column({
		nullable: true,
		type: 'enum',
		enum: MyInfoFieldType,
	})
	private _myInfoFieldType: MyInfoFieldType;

	public get myInfoFieldType(): MyInfoFieldType {
		return this._myInfoFieldType;
	}

	public set myInfoFieldType(value: MyInfoFieldType) {
		this._myInfoFieldType = value;
	}

	public static create(serviceId: number, name: string, myInfoFieldType: MyInfoFieldType): MyInfoDynamicField {
		const dynamicField = new MyInfoDynamicField();
		dynamicField.serviceId = serviceId;
		dynamicField.myInfoFieldType = myInfoFieldType;
		dynamicField.name = name;
		dynamicField.isMandatory = false;

		return dynamicField;
	}

	public acceptVisitor(visitor: IDynamicFieldVisitor): void {
		visitor.visitMyInfo(this);
	}

	public async acceptVisitorAsync(visitor: IDynamicFieldVisitorAsync): Promise<void> {
		await visitor.visitMyInfo(this);
	}
}

@ChildEntity(DynamicFieldEntityType.SelectListDynamicFieldType)
export class SelectListDynamicField extends DynamicField {
	constructor() {
		super();
	}

	public static create(
		serviceId: number,
		name: string,
		options: SelectListOption[],
		isMandatory: boolean,
	): DynamicField {
		const dynamicField = new SelectListDynamicField();
		dynamicField.serviceId = serviceId;
		dynamicField.name = name;
		dynamicField.options = options;
		dynamicField.isMandatory = isMandatory;
		return dynamicField;
	}

	@Column({ type: 'jsonb', nullable: false, default: '[]' })
	private _options: SelectListOption[];

	public get options(): SelectListOption[] {
		return this._options;
	}
	public set options(options: SelectListOption[]) {
		this._options = options;
	}

	public acceptVisitor(visitor: IDynamicFieldVisitor): void {
		visitor.visitSelectList(this);
	}

	public async acceptVisitorAsync(visitor: IDynamicFieldVisitorAsync): Promise<void> {
		await visitor.visitSelectList(this);
	}
}

export type SelectListOption = {
	key: number | string;
	value: string;
};

@ChildEntity(DynamicFieldEntityType.TextDynamicFieldType)
export class TextDynamicField extends DynamicField {
	constructor() {
		super();
	}

	public static create(serviceId: number, name: string, charLimit: number, isMandatory: boolean): DynamicField {
		const dynamicField = new TextDynamicField();
		dynamicField.serviceId = serviceId;
		dynamicField.name = name;
		dynamicField.charLimit = charLimit;
		dynamicField.isMandatory = isMandatory;
		return dynamicField;
	}

	@Column({ nullable: false, default: 0 })
	private _charLimit: number;

	public get charLimit(): number {
		return this._charLimit;
	}

	public set charLimit(value: number) {
		this._charLimit = value;
	}

	public acceptVisitor(visitor: IDynamicFieldVisitor): void {
		visitor.visitTextField(this);
	}

	public async acceptVisitorAsync(visitor: IDynamicFieldVisitorAsync): Promise<void> {
		await visitor.visitTextField(this);
	}
}

@ChildEntity(DynamicFieldEntityType.DateOnlyDynamicField)
export class DateOnlyDynamicField extends DynamicField {
	constructor() {
		super();
	}

	public static create(serviceId: number, name: string, isMandatory: boolean): DynamicField {
		const dynamicField = new DateOnlyDynamicField();
		dynamicField.serviceId = serviceId;
		dynamicField.name = name;
		dynamicField.isMandatory = isMandatory;
		return dynamicField;
	}

	public acceptVisitor(visitor: IDynamicFieldVisitor): void {
		visitor.visitDateOnlyField(this);
	}

	public async acceptVisitorAsync(visitor: IDynamicFieldVisitorAsync): Promise<void> {
		await visitor.visitDateOnlyField(this);
	}
}
