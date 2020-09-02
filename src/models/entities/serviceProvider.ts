import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
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

	constructor() {
	}

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

	public get service(): Service {
		return this._service;
	}

	@PrimaryGeneratedColumn()
	private _id: number;

	public get id(): number {
		return this._id;
	}

	public set id(id: number) {
		this._id = id;
	}

	@Column({ type: "varchar", length: 300 })
	private _name: string;

	public get name(): string {
		return this._name;
	}

	public set name(value: string) {
		this._name = value;
	}

	@Column({ nullable: true })
	private _email?: string;

	public get email(): string {
		return this._email;
	}

	public set email(value: string) {
		this._email = value;
	}

	@Column({ nullable: true })
	private _phone?: string;

	public get phone(): string {
		return this._phone;
	}

	public set phone(value: string) {
		this._phone = value;
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

	@ManyToOne('Schedule', { nullable: true })
	@JoinColumn({ name: '_scheduleId' })
	public _schedule: Schedule;

	public get schedule(): Schedule {
		return this._schedule;
	}

	public set schedule(schedule: Schedule) {
		this._schedule = schedule;
	}

	@Column({ nullable: true })
	private _scheduleId?: number;

	public get scheduleId(): number {
		return this._scheduleId;
	}

	public set scheduleId(id: number) {
		this._scheduleId = id;
	}

	@Column({ nullable: true })
	private _timeslotsScheduleId: number;

	public get timeslotsScheduleId(): number {
		return this._timeslotsScheduleId;
	}

	public set timeslotsScheduleId(id: number) {
		this._timeslotsScheduleId = id;
	}

	@OneToOne(type => TimeslotsSchedule, e => e._serviceProvider, {
		cascade: true,
	})
	@JoinColumn({ name: '_timeslotsScheduleId' })
	private _timeslotsSchedule: TimeslotsSchedule;

	public get timeslotsSchedule(): TimeslotsSchedule {
		return this._timeslotsSchedule;
	}

	public set timeslotsSchedule(value: TimeslotsSchedule) {
		this._timeslotsSchedule = value;
	}

	public static create(name: string, calendar: Calendar, serviceId: number, email?: string, phone?: string): ServiceProvider {
		const instance = new ServiceProvider();
		instance._serviceId = serviceId;
		instance._name = name;
		instance._createdAt = new Date();
		instance._status = ServiceProviderStatus.Valid;
		instance._calendar = calendar;
		instance._email = email;
		instance._phone = phone;
		return instance;
	}
}
