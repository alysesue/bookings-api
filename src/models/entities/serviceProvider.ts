import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Calendar } from './calendar';
import { ServiceProviderStatus } from '../serviceProviderStatus';
import { Service } from './service';
import { ScheduleForm } from './scheduleForm';
import { IEntityWithScheduleForm, IEntityWithTimeslotsSchedule, IServiceProvider } from '../interfaces';
import { TimeslotsSchedule } from './timeslotsSchedule';
import { ServiceProviderGroupMap } from './serviceProviderGroupMap';

const DEFAULT_AUTO_ACCEPT_BOOKINGS = true;

@Entity()
export class ServiceProvider implements IServiceProvider, IEntityWithScheduleForm, IEntityWithTimeslotsSchedule {
	private constructor() {}
	@PrimaryGeneratedColumn()
	private _id: number;

	public get id(): number {
		return this._id;
	}

	public set id(id: number) {
		this._id = id;
	}

	@OneToOne((type) => ServiceProviderGroupMap, (e) => e._serviceProvider, { nullable: true })
	public _serviceProviderGroupMap: ServiceProviderGroupMap;

	public get autoAcceptBookings(): boolean {
		return this._autoAcceptBookings;
	}

	public get createdAt(): Date {
		return this._createdAt;
	}

	public set createdAt(value: Date) {
		this._createdAt = value;
	}

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
	@Index()
	private _serviceId: number;

	public get serviceId(): number {
		return this._serviceId;
	}

	public set serviceId(value: number) {
		this._serviceId = value;
	}

	@ManyToOne((type) => Service)
	@JoinColumn({ name: '_serviceId' })
	private _service: Service;

	public set service(service: Service) {
		this._service = service;
	}
	public get service(): Service {
		return this._service;
	}

	@Column({ type: 'varchar', length: 300 })
	private _name: string;

	public get name(): string {
		return this._name;
	}

	public set name(value: string) {
		this._name = value;
	}

	public static create(name: string, serviceId: number, email?: string, phone?: string) {
		const instance = new ServiceProvider();
		instance._serviceId = serviceId;
		instance._name = name;
		instance._createdAt = new Date();
		instance._status = ServiceProviderStatus.Valid;
		instance._email = email;
		instance._phone = phone;
		instance._autoAcceptBookings = DEFAULT_AUTO_ACCEPT_BOOKINGS;
		return instance;
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

	@OneToOne('Calendar')
	@JoinColumn()
	public _calendar: Calendar;

	public get calendar(): Calendar {
		return this._calendar;
	}

	public set calendar(calendar: Calendar) {
		this._calendar = calendar;
	}

	@ManyToOne('ScheduleForm', { nullable: true })
	@JoinColumn({ name: '_scheduleFormId' })
	public _scheduleForm: ScheduleForm;

	public get scheduleForm(): ScheduleForm {
		return this._scheduleForm;
	}

	public set scheduleForm(scheduleForm: ScheduleForm) {
		this._scheduleForm = scheduleForm;
	}

	@Column({ nullable: true })
	private _scheduleFormId?: number;

	public set scheduleFormId(id: number) {
		this._scheduleFormId = id;
	}

	public get scheduleFormId(): number {
		return this._scheduleFormId;
	}

	@Column({ nullable: true })
	private _timeslotsScheduleId: number;

	public set timeslotsScheduleId(id: number) {
		this._timeslotsScheduleId = id;
	}

	public get timeslotsScheduleId(): number {
		return this._timeslotsScheduleId;
	}

	@OneToOne((type) => TimeslotsSchedule, (e) => e._serviceProvider, {
		cascade: true,
	})
	@JoinColumn({ name: '_timeslotsScheduleId' })
	public _timeslotsSchedule: TimeslotsSchedule;

	public set timeslotsSchedule(value: TimeslotsSchedule) {
		this._timeslotsSchedule = value;
	}

	public get timeslotsSchedule(): TimeslotsSchedule {
		return this._timeslotsSchedule;
	}

	@Column({ type: 'boolean', default: DEFAULT_AUTO_ACCEPT_BOOKINGS })
	private _autoAcceptBookings: boolean;
}
