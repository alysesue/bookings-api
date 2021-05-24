import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IEntityWithScheduleForm, IEntityWithTimeslotsSchedule, IService } from '../interfaces';
import { TimeslotsSchedule } from './timeslotsSchedule';
import { ServiceAdminGroupMap } from './serviceAdminGroupMap';
import { Organisation } from './organisation';
import { ScheduleForm } from './scheduleForm';
import { Label } from './label';
import { LabelCategory } from './labelCategory';

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

	@ManyToOne(() => Organisation)
	@JoinColumn({ name: '_organisationId' })
	private _organisation: Organisation;

	public set organisation(value: Organisation) {
		this._organisation = value;
	}

	public get organisation() {
		return this._organisation;
	}

	@OneToOne(() => ServiceAdminGroupMap, (e) => e._service, {
		nullable: true,
		cascade: ['insert', 'update', 'remove', 'soft-remove'],
	})
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

	public get name(): string {
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

	@OneToOne(() => TimeslotsSchedule, (e) => e._service, { cascade: true })
	@JoinColumn({ name: '_timeslotsScheduleId' })
	public _timeslotsSchedule: TimeslotsSchedule;

	public set timeslotsSchedule(value: TimeslotsSchedule) {
		this._timeslotsSchedule = value;
	}
	public get timeslotsSchedule(): TimeslotsSchedule {
		return this._timeslotsSchedule;
	}

	public static create(
		name: string,
		orga: Organisation,
		isSpAutoAssigned = false,
		labels: Label[] = [],
		categories: LabelCategory[] = [],
		emailSuffix?: string,
		noNric = false,
	) {
		const service = new Service();
		service._name = name.trim();
		service._organisation = orga;
		service._organisationId = orga.id;
		service._isSpAutoAssigned = isSpAutoAssigned;
		service._noNric = noNric;
		service._serviceAdminGroupMap = ServiceAdminGroupMap.create(
			ServiceAdminGroupMap.createServiceOrganisationRef(
				service.getServiceRef(),
				orga._organisationAdminGroupMap?.organisationRef,
			),
		);
		service.labels = labels;
		service.categories = categories;
		service._emailSuffix = emailSuffix;
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
	private _noNric: boolean;

	public get noNric(): boolean {
		return this._noNric;
	}

	public set noNric(value: boolean) {
		this._noNric = value;
	}

	@Column({ nullable: false, default: false })
	private _isSpAutoAssigned: boolean;

	public get isSpAutoAssigned(): boolean {
		return this._isSpAutoAssigned;
	}

	public set isSpAutoAssigned(value: boolean) {
		this._isSpAutoAssigned = value;
	}

	@OneToMany(() => Label, (label) => label.service, { cascade: true })
	public labels: Label[];

	@OneToMany(() => LabelCategory, (category) => category.service, { cascade: true })
	public categories: LabelCategory[];

	@Column({ nullable: false, default: false })
	private _sendNotifications: boolean;

	public get sendNotifications(): boolean {
		return this._sendNotifications;
	}

	public set sendNotifications(value: boolean) {
		this._sendNotifications = value;
	}

	@Column({ nullable: false, default: false })
	private _sendNotificationsToServiceProviders: boolean;

	public get sendNotificationsToServiceProviders(): boolean {
		return this._sendNotificationsToServiceProviders;
	}

	public set sendNotificationsToServiceProviders(value: boolean) {
		this._sendNotificationsToServiceProviders = value;
	}

	@Column({ type: 'varchar', length: 100, nullable: true })
	private _emailSuffix?: string;

	public get emailSuffix(): string {
		return this._emailSuffix;
	}

	public set emailSuffix(value: string) {
		this._emailSuffix = value;
	}
}
