import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Service } from './service';
import { IEntityWithScheduleForm, IEntityWithTimeslotsSchedule, IServiceProvider } from '../interfaces';
import { ServiceProviderGroupMap } from './serviceProviderGroupMap';
import { ScheduleForm } from './scheduleForm';
import { TimeslotsSchedule } from './timeslotsSchedule';

const DEFAULT_AUTO_ACCEPT_BOOKINGS = true;
const DEFAULT_SCHEFULE_FORM_CONFIRMED = false;

@Entity()
export class ServiceProvider implements IServiceProvider, IEntityWithScheduleForm, IEntityWithTimeslotsSchedule {
	constructor() { }

	@PrimaryGeneratedColumn()
	private _id: number;

	public get id(): number {
		return this._id;
	}

	public set id(id: number) {
		this._id = id;
	}

	@OneToOne(() => ServiceProviderGroupMap, (e) => e._serviceProvider, { nullable: true, cascade: true })
	private _serviceProviderGroupMap: ServiceProviderGroupMap;

	public get serviceProviderGroupMap(): ServiceProviderGroupMap {
		return this._serviceProviderGroupMap;
	}

	public set serviceProviderGroupMap(value: ServiceProviderGroupMap) {
		this._serviceProviderGroupMap = value;
	}

	public get autoAcceptBookings(): boolean {
		return this._autoAcceptBookings;
	}

	public set autoAcceptBookings(value: boolean) {
		this._autoAcceptBookings = value;
	}

	public get createdAt(): Date {
		return this._createdAt;
	}

	public set createdAt(value: Date) {
		this._createdAt = value;
	}

	@Column({ type: 'varchar', length: 100, nullable: true })
	private _agencyUserId: string;

	public get agencyUserId() {
		return this._agencyUserId;
	}

	public set agencyUserId(value: string) {
		this._agencyUserId = value;
	}

	@Column()
	private _createdAt: Date;

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
	@Index()
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

	@Column({ type: 'boolean', nullable: false, default: DEFAULT_SCHEFULE_FORM_CONFIRMED })
	private _scheduleFormConfirmed: boolean;

	public get scheduleFormConfirmed(): boolean {
		return this._scheduleFormConfirmed;
	}

	public set scheduleFormConfirmed(value: boolean) {
		this._scheduleFormConfirmed = value;
	}

	public static create(
		name: string,
		serviceId: number,
		email?: string,
		phone?: string,
		agencyUserId?: string,
		autoAcceptBookings = DEFAULT_AUTO_ACCEPT_BOOKINGS,
	) {
		const instance = new ServiceProvider();
		instance._serviceId = serviceId;
		instance._name = name;
		instance._createdAt = new Date();
		instance._email = email;
		instance._phone = phone;
		instance._agencyUserId = agencyUserId;
		instance._autoAcceptBookings = autoAcceptBookings;
		instance._scheduleFormConfirmed = DEFAULT_SCHEFULE_FORM_CONFIRMED;
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

	@OneToOne('ScheduleForm', { nullable: true, cascade: true })
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

	@OneToOne('TimeslotsSchedule', '_serviceProvider', {
		cascade: true,
	})
	@JoinColumn({ name: '_timeslotsScheduleId' })
	private _timeslotsSchedule: TimeslotsSchedule;

	public set timeslotsSchedule(value: TimeslotsSchedule) {
		this._timeslotsSchedule = value;
	}

	public get timeslotsSchedule(): TimeslotsSchedule {
		return this._timeslotsSchedule;
	}

	@Column({ type: 'boolean', default: DEFAULT_AUTO_ACCEPT_BOOKINGS })
	private _autoAcceptBookings: boolean;
}
