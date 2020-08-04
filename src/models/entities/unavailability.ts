import { Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Service } from "./service";
import { ServiceProvider } from "./serviceProvider";
import { IUnavailability } from "../interfaces";
import { DataListElement } from "k6/html";

@Entity()
export class Unavailability implements IUnavailability {
	constructor() { }

	public static create(): Unavailability {
		const data = new Unavailability();
		data._serviceProviders = [];

		return data;
	}

	@PrimaryGeneratedColumn()
	private _id: number;

	public get id(): number {
		return this._id;
	}

	public set id(value: number) {
		this._id = value;
	}

	@Column({ nullable: false })
	private _serviceId: number;

	public get serviceId(): number {
		return this._serviceId;
	}

	public set serviceId(value: number) {
		this._serviceId = value;
	}

	@ManyToOne(type => Service)
	@JoinColumn({ name: '_serviceId' })
	private _service: Service;

	@Column()
	@Index()
	private _start: Date;
	public get start(): Date {
		return this._start;
	}

	public set start(value: Date) {
		this._start = value;
	}

	@Column()
	@Index()
	private _end: Date;
	public get end(): Date {
		return this._end;
	}

	public set end(value: Date) {
		this._end = value;
	}

	@Column()
	private _allServiceProviders: boolean;
	public get allServiceProviders() {
		return this._allServiceProviders;
	}

	public set allServiceProviders(value: boolean) {
		this._allServiceProviders = value;
	}

	@ManyToMany(type => ServiceProvider, { cascade: true })
	@JoinTable({
		name: 'unavailable_service_provider',
		joinColumn: { name: 'unavailability_id' },
		inverseJoinColumn: { name: 'serviceProvider_id' }
	})
	private _serviceProviders: ServiceProvider[];

	public set serviceProviders(providers: ServiceProvider[]) {
		this._serviceProviders = providers;
	}

	public get serviceProviders() {
		return this._serviceProviders;
	}
}
