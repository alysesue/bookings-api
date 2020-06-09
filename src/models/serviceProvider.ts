import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Calendar } from "./calendar";
import { ServiceProviderStatus } from "./serviceProviderStatus";
import { Service } from "./service";

@Entity()
export class ServiceProvider extends BaseEntity {

	@Column()
	private _createdAt: Date;

	@Column()
	private _status: ServiceProviderStatus;

	public get status(): ServiceProviderStatus {
		return this._status;
	}

	public set status(value: ServiceProviderStatus) {
		this._status = value;
	}

	@Column({ nullable: false })
	private _serviceId: number;

	@ManyToOne(type => Service)
	@JoinColumn({ name: '_serviceId' })
	private _service: Service;

	@PrimaryGeneratedColumn()
	private _id: number;

	public set id(id: number) {
		this._id = id;
	}

	public get id(): number {
		return this._id;
	}

	@Column({ type: "varchar", length: 300 })
	private _name: string;

	constructor(service: Service, name: string, calendar: Calendar) {
		super();
		this._service = service;
		this._name = name;
		this._createdAt = new Date();
		this._status = ServiceProviderStatus.Valid;
		this._calendar = calendar;
	}

	public get name(): string {
		return this._name;
	}

	public set name(value: string) {
		this._name = value;
	}

	@OneToOne("Calendar")
	@JoinColumn()
	public _calendar: Calendar;

	public get calendar(): Calendar {
		return this._calendar;
	}

	public set calendar(calendar: Calendar) {
		this._calendar = calendar;
	}

	public get service(): Service {
		return this._service;
	}
}
