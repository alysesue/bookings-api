import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IEntityWithScheduleForm, IEntityWithTimeslotsSchedule, IService } from '../interfaces';
import { TimeslotsSchedule } from './timeslotsSchedule';
import { ServiceAdminGroupMap } from './serviceAdminGroupMap';
import { Organisation } from './organisation';
import { ScheduleForm } from './scheduleForm';
import { Label } from './label';
import { LabelCategory } from './labelCategory';
import { DateHelper } from '../../infrastructure/dateHelper';
import { CitizenAuthenticationType } from '../citizenAuthenticationType';

const DEFAULT_CITIZEN_AUTH = [CitizenAuthenticationType.Singpass];

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
		cascade: true,
	})
	private _serviceAdminGroupMap: ServiceAdminGroupMap;

	public get serviceAdminGroupMap(): ServiceAdminGroupMap {
		return this._serviceAdminGroupMap;
	}

	public set serviceAdminGroupMap(value: ServiceAdminGroupMap) {
		this._serviceAdminGroupMap = value;
	}

	@Column({ type: 'varchar', length: 500, nullable: false })
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

	public static create(name: string, orga: Organisation, labels: Label[] = [], categories: LabelCategory[] = []) {
		const service = new Service();
		service._name = name.trim();
		service._organisation = orga;
		service._organisationId = orga.id;
		service._serviceAdminGroupMap = ServiceAdminGroupMap.create(
			ServiceAdminGroupMap.createServiceOrganisationRef(
				service.getServiceRef(),
				orga._organisationAdminGroupMap?.organisationRef,
			),
		);

		service.labels = labels;
		service.categories = categories;
		service.citizenAuthentication = DEFAULT_CITIZEN_AUTH;

		return service;
	}

	public getServiceRef() {
		return this._name.toLowerCase().replace(/ /g, '');
	}

	@Column({
		type: 'enum',
		enum: CitizenAuthenticationType,
		array: true,
		default: DEFAULT_CITIZEN_AUTH,
		nullable: false,
	})
	private _citizenAuthentication: CitizenAuthenticationType[];

	public get citizenAuthentication(): CitizenAuthenticationType[] {
		return this._citizenAuthentication;
	}

	public set citizenAuthentication(value: CitizenAuthenticationType[]) {
		this._citizenAuthentication = value;
	}

	public hasCitizenAuthentication(auth: CitizenAuthenticationType): boolean {
		return !!this._citizenAuthentication?.some((e) => e === auth);
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

	public set isStandAlone(isStandAlone: boolean) {
		this._isStandAlone = isStandAlone;
	}

	@Column({ nullable: false, default: false })
	private _noNric: boolean;

	public get noNric(): boolean {
		return this._noNric;
	}

	public setNoNric(value?: boolean) {
		this._noNric = value || false;
	}

	@Column({ nullable: false, default: false })
	private _isSpAutoAssigned: boolean;

	public get isSpAutoAssigned(): boolean {
		return this._isSpAutoAssigned;
	}

	public setIsSpAutoAssigned(value?: boolean) {
		this._isSpAutoAssigned = value || false;
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

	@Column({ nullable: false, default: false })
	private _sendSMSNotifications: boolean;

	public get sendSMSNotifications(): boolean {
		return this._sendSMSNotifications;
	}

	public set sendSMSNotifications(value: boolean) {
		this._sendSMSNotifications = value;
	}

	@Column({ type: 'varchar', length: 100, nullable: true })
	private _emailSuffix?: string;

	public get emailSuffix(): string {
		return this._emailSuffix;
	}

	public set emailSuffix(value: string) {
		this._emailSuffix = value;
	}

	@Column({ type: 'varchar', length: 2000, nullable: true })
	private _videoConferenceUrl?: string;

	public get videoConferenceUrl(): string {
		return this._videoConferenceUrl;
	}

	public set videoConferenceUrl(value: string) {
		this._videoConferenceUrl = value;
	}

	@Column({ type: 'varchar', length: 500, nullable: true })
	private _description: string;

	public get description(): string {
		return this._description;
	}

	public set description(value: string) {
		this._description = value;
	}

	@Column({ nullable: true })
	public _minDaysInAdvance?: number;

	public get minDaysInAdvance(): number {
		return this._minDaysInAdvance;
	}

	public set minDaysInAdvance(value: number) {
		this._minDaysInAdvance = value;
	}

	@Column({ nullable: true })
	public _maxDaysInAdvance?: number;

	public get maxDaysInAdvance(): number {
		return this._maxDaysInAdvance;
	}

	public set maxDaysInAdvance(value: number) {
		this._maxDaysInAdvance = value;
	}

	public filterDaysInAdvance(params: { now: Date; start: Date; end: Date }): { start: Date; end: Date } {
		const lowerLimit = this.minDaysInAdvance ? DateHelper.addDays(params.now, this.minDaysInAdvance) : undefined;
		const upperLimit = this.maxDaysInAdvance ? DateHelper.addDays(params.now, this.maxDaysInAdvance) : undefined;

		let start = params.start;
		let end = params.end;
		if (lowerLimit && start < lowerLimit) {
			start = lowerLimit;
		}
		if (upperLimit && end > upperLimit) {
			end = upperLimit;
		}

		return { start, end };
	}

	@Column({ nullable: false, default: false })
	private _requireVerifyBySA: boolean;

	public get requireVerifyBySA(): boolean {
		return this._requireVerifyBySA;
	}

	public set requireVerifyBySA(requireVerifyBySA: boolean) {
		this._requireVerifyBySA = requireVerifyBySA;
	}

	@Column({ nullable: false, default: false })
	private _hasSalutation: boolean;

	public get hasSalutation(): boolean {
		return this._hasSalutation;
	}

	public set hasSalutation(value: boolean) {
		this._hasSalutation = value;
	}
}
