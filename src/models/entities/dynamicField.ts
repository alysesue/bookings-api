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

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
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

	public abstract get fieldType(): string;
}

@ChildEntity()
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
	public get fieldType(): string {
		return 'SelectListDynamicField';
	}

	@Column({ type: 'jsonb', nullable: false, default: '[]' })
	private _options: SelectListOption[];

	public get options(): SelectListOption[] {
		return this._options;
	}
	public set options(options: SelectListOption[]) {
		this._options = options;
	}
}

export type SelectListOption = {
	key: number;
	value: string;
};
