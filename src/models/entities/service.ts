import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IEntityWithScheduleForm, IEntityWithTimeslotsSchedule, IService } from '../interfaces';
import { TimeslotsSchedule } from './timeslotsSchedule';
import { ServiceAdminGroupMap } from './serviceAdminGroupMap';
import { Organisation } from './organisation';
import { ScheduleForm } from './scheduleForm';

@Entity()
@Index(['_organisationId', '_name'], { unique: true })
export class Service implements IService, IEntityWithScheduleForm, IEntityWithTimeslotsSchedule {
	public constructor() {}

	@PrimaryGeneratedColumn()
	private _id: number;

	public set id(id: number) {
		this._id = id;
	}

	public get id(): number {
		return this._id;
	}

	@Column({ nullable: false })
	@Index()
	private _organisationId: number;

	public set organisationId(value: number) {
		this._organisationId = value;
	}

	public get organisationId() {
		return this._organisationId;
	}

	@ManyToOne((type) => Organisation)
	@JoinColumn({ name: '_organisationId' })
	private _organisation: Organisation;

	public set organisation(value: Organisation) {
		this._organisation = value;
	}

	public get organisation() {
		return this._organisation;
	}

	@OneToOne((type) => ServiceAdminGroupMap, (e) => e._service, { nullable: true, cascade: true })
	private _serviceAdminGroupMap: ServiceAdminGroupMap;

	public get serviceAdminGroupMap(): ServiceAdminGroupMap {
		return this._serviceAdminGroupMap;
	}

	public set serviceAdminGroupMap(value: ServiceAdminGroupMap) {
		this._serviceAdminGroupMap = value;
	}

	@Column({ type: 'varchar', length: 100, nullable: false })
	private _name: string;

	public set name(name: string) {
		this._name = name;
	}

	public get name() {
		return this._name;
	}

	@OneToOne('ScheduleForm', { nullable: true, cascade: true })
	@JoinColumn({ name: '_scheduleFormId' })
	public _scheduleForm: ScheduleForm;

	public set scheduleForm(schedule: ScheduleForm) {
		this._scheduleForm = schedule;
	}

	public get scheduleForm(): ScheduleForm {
		return this._scheduleForm;
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

	@OneToOne((type) => TimeslotsSchedule, (e) => e._service, { cascade: true })
	@JoinColumn({ name: '_timeslotsScheduleId' })
	public _timeslotsSchedule: TimeslotsSchedule;

	public set timeslotsSchedule(value: TimeslotsSchedule) {
		this._timeslotsSchedule = value;
	}
	public get timeslotsSchedule(): TimeslotsSchedule {
		return this._timeslotsSchedule;
	}

	public static create(name: string, orga: Organisation, isSpAutoAssigned = false) {
		const service = new Service();
		service._name = name.trim();
		service._organisation = orga;
		service._organisationId = orga.id;
		service._isSpAutoAssigned = isSpAutoAssigned;
		service._serviceAdminGroupMap = ServiceAdminGroupMap.create(
			ServiceAdminGroupMap.createServiceOrganisationRef(
				service.getServiceRef(),
				orga._organisationAdminGroupMap.organisationRef,
			),
		);
		return service;
	}

	public getServiceRef() {
		return this._name.toLowerCase().replace(/ /g, '');
	}

	@Column({ type: 'boolean', default: false })
	private _allowAnonymousBookings: boolean;

	public set allowAnonymousBookings(value: boolean) {
		this._allowAnonymousBookings = value;
	}
	public get allowAnonymousBookings(): boolean {
		return this._allowAnonymousBookings;
	}

	@Column({ nullable: false, default: false })
	private _isOnHold: boolean;

	public get isOnHold(): boolean {
		return this._isOnHold;
	}

	public set isOnHold(isOnHold: boolean) {
		this._isOnHold = isOnHold;
	}

	@Column({ nullable: false, default: false })
	private _isStandAlone: boolean;

	public get isStandAlone(): boolean {
		return this._isStandAlone;
	}

	public set isStandAlone(isOnHold: boolean) {
		this._isStandAlone = isOnHold;
	}

	@Column({ nullable: false, default: false })
	private _isSpAutoAssigned: boolean;

	public get isSpAutoAssigned(): boolean {
		return this._isSpAutoAssigned;
	}

	public set isSpAutoAssigned(value: boolean) {
		this._isSpAutoAssigned = value;
	}
}
