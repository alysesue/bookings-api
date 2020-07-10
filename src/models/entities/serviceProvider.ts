import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Calendar } from "./calendar";
import { ServiceProviderStatus } from "../serviceProviderStatus";
import { Service } from "./service";
import { Schedule } from './schedule';
import { IEntityWithSchedule, IEntityWithTimeslotsSchedule, IServiceProvider } from '../interfaces';
import { TimeslotsSchedule } from "./timeslotsSchedule";

@Entity()
export class ServiceProvider implements IServiceProvider, IEntityWithSchedule, IEntityWithTimeslotsSchedule {

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
	public get serviceId(): number {
		return this._serviceId;
	}
	public set serviceId(value: number) {
		this._serviceId = value;
	}

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

	constructor() {
	}

	public static create(name: string, calendar: Calendar, serviceId: number): ServiceProvider {
		const instance = new ServiceProvider();
		instance._serviceId = serviceId;
		instance._name = name;
		instance._createdAt = new Date();
		instance._status = ServiceProviderStatus.Valid;
		instance._calendar = calendar;
		return instance;
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

	@ManyToOne('Schedule', { nullable: true })
	@JoinColumn({ name: '_scheduleId' })
	public _schedule: Schedule;

	public set schedule(schedule: Schedule) {
		this._schedule = schedule;
	}

	public get schedule(): Schedule {
		return this._schedule;
	}

	@Column({ nullable: true })
	private _scheduleId?: number;

	public set scheduleId(id: number) { this._scheduleId = id; }
	public get scheduleId(): number { return this._scheduleId; }

	@Column({ nullable: true })
	private _timeslotsScheduleId: number;

	public set timeslotsScheduleId(id: number) { this._timeslotsScheduleId = id; }
	public get timeslotsScheduleId(): number { return this._timeslotsScheduleId; }

	@OneToOne(type => TimeslotsSchedule, e => e._serviceProvider)
	@JoinColumn({ name: '_timeslotsScheduleId' })
	private _timeslotsSchedule: TimeslotsSchedule;

	public set timeslotsSchedule(value: TimeslotsSchedule) { this._timeslotsSchedule = value; }
	public get timeslotsSchedule(): TimeslotsSchedule { return this._timeslotsSchedule; }
}
