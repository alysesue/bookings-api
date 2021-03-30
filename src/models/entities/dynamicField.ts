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
}

@ChildEntity()
export class SelectListDynamicField extends DynamicField {
	@Column({ type: 'jsonb', nullable: false, default: '[]' })
	private _options: SelectListOption[];

	public get options(): SelectListOption[] {
		return this._options;
	}
}

export type SelectListOption = {
	key: number;
	value: string;
};
