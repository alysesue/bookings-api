import {
	ChildEntity,
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	TableInheritance,
} from 'typeorm';
import { Service } from './service';

export interface IDynamicFieldVisitor {
	visitSelectList(_selectListField: SelectListDynamicField);
	visitTextField(_textField: TextDynamicField);
}

/**
 * IMPORTANT: Make sure you export all CHILD entites in entities/index.ts
 */
export enum DynamicFieldEntityType {
	SelectListDynamicFieldType = 'SelectListDynamicField',
	TextDynamicFieldType = 'TextDynamicField',
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

	@Column({
		type: 'enum',
		enum: DynamicFieldEntityType,
	})
	public _type: DynamicFieldEntityType;

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

	public abstract acceptVisitor(visitor: IDynamicFieldVisitor): void;
}

@ChildEntity(DynamicFieldEntityType.SelectListDynamicFieldType)
export class SelectListDynamicField extends DynamicField {
	public static create(serviceId: number, name: string, options: SelectListOption[], id?: number): DynamicField {
		const dynamicField = new SelectListDynamicField();
		if (id) {
			dynamicField.id = id;
		}
		dynamicField.serviceId = serviceId;
		dynamicField.name = name;
		dynamicField.options = options;
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
}

export type SelectListOption = {
	key: number;
	value: string;
};

@ChildEntity(DynamicFieldEntityType.TextDynamicFieldType)
export class TextDynamicField extends DynamicField {
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
}
