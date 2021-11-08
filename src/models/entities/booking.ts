import {
	Column,
	Entity,
	Generated,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { BookingStatus } from '../bookingStatus';
import * as timeSpan from '../../tools/timeSpan';
import { ChangeLogAction } from '../changeLogAction';
import { DateHelper } from '../../infrastructure/dateHelper';
import { ServiceProvider } from './serviceProvider';
import { Service } from './service';
import { User } from './user';
import { Event } from './event';
import { BookingChangeLog } from './bookingChangeLog';
import { DynamicValueJsonModel } from './jsonModels';
import { BookingWorkflow } from './bookingWorkflow';
import { BookedSlot } from './bookedSlot';

export const BookingIsolationLevel: IsolationLevel = 'READ COMMITTED';

const HOLD_DURATION_IN_MINS = 10;

export class BookingBuilder {
	public serviceId: number;
	public eventId: number;
	public slots: BookedSlot[] = [];
	public startDateTime: Date;
	public endDateTime: Date;
	public refId: string;
	public location: string;
	public description: string;
	public videoConferenceUrl: string;
	public serviceProviderId: number;
	public creator: User;
	public citizenUinFin: string;
	public citizenPhone: string;
	public citizenName: string;
	public citizenEmail: string;
	public autoAccept: boolean;
	public captchaToken: string;
	public markOnHold: boolean;
	public reasonToReject: string;
	public pendingSA: boolean;
	public address: string;
	public postalCode: string;

	public withPendingSA(pendingSA: boolean): BookingBuilder {
		this.pendingSA = pendingSA;
		return this;
	}

	public withServiceId(serviceId: number): BookingBuilder {
		this.serviceId = serviceId;
		return this;
	}

	public withEventId(eventId: number): BookingBuilder {
		this.eventId = eventId;
		return this;
	}

	public withSlots(slots: [Date, Date, number][]): BookingBuilder {
		slots.forEach((slot) => {
			const newSlot = new BookedSlot();
			newSlot.startDateTime = slot[0];
			newSlot.endDateTime = slot[1];
			newSlot.serviceProviderId = slot[2];
			this.slots.push(newSlot);
		});
		return this;
	}

	public withStartDateTime(startDateTime: Date): BookingBuilder {
		this.startDateTime = startDateTime;
		return this;
	}

	public withEndDateTime(endDateTime: Date): BookingBuilder {
		this.endDateTime = endDateTime;
		return this;
	}

	public withRefId(refId: string): BookingBuilder {
		this.refId = refId;
		return this;
	}

	public withLocation(location: string): BookingBuilder {
		this.location = location;
		return this;
	}

	public withDescription(description: string): BookingBuilder {
		this.description = description;
		return this;
	}

	public withVideoConferenceUrl(videoConferenceUrl: string): BookingBuilder {
		this.videoConferenceUrl = videoConferenceUrl;
		return this;
	}

	public withServiceProviderId(serviceProviderId: number): BookingBuilder {
		this.serviceProviderId = serviceProviderId;
		return this;
	}

	public withCreator(currentUser: User): BookingBuilder {
		this.creator = currentUser;
		return this;
	}

	public withCitizenUinFin(citizenUinFin: string): BookingBuilder {
		this.citizenUinFin = citizenUinFin;
		return this;
	}

	public withCitizenPhone(citizenPhone: string): BookingBuilder {
		this.citizenPhone = citizenPhone;
		return this;
	}

	public withCitizenName(citizenName: string): BookingBuilder {
		this.citizenName = citizenName;
		return this;
	}

	public withCitizenEmail(citizenEmail: string): BookingBuilder {
		this.citizenEmail = citizenEmail;
		return this;
	}

	public withReasonToReject(reasonToReject: string): BookingBuilder {
		this.reasonToReject = reasonToReject;
		return this;
	}

	public withAutoAccept(autoAccept: boolean): BookingBuilder {
		this.autoAccept = autoAccept;
		return this;
	}
	public withCaptchaToken(captchaToken: string): BookingBuilder {
		this.captchaToken = captchaToken;
		return this;
	}

	public withMarkOnHold(markOnHold: boolean): BookingBuilder {
		this.markOnHold = markOnHold;
		return this;
	}

	public withAddress(address: string): BookingBuilder {
		this.address = address;
		return this;
	}

	public withPostalCode(postalCode: string): BookingBuilder {
		this.postalCode = postalCode;
		return this;
	}

	public build(): Booking {
		const instance = new Booking();

		if (this.markOnHold) {
			instance.markOnHold();
		} else {
			instance.setAutoAccept({ autoAccept: !!this.serviceProviderId && (this.autoAccept || !!this.eventId) });
		}

		if (this.pendingSA) {
			instance.setPendingSA();
		}

		instance.serviceId = this.serviceId;
		instance.eventId = this.eventId;
		instance.serviceProviderId = this.serviceProviderId;
		instance.startDateTime = this.startDateTime;
		instance.endDateTime = this.endDateTime;
		instance.refId = this.refId;
		instance.location = this.location;
		instance.description = this.description;
		instance.videoConferenceUrl = this.videoConferenceUrl;
		instance.creator = this.creator;
		instance.citizenUinFin = this.citizenUinFin;
		instance.citizenPhone = this.citizenPhone;
		instance.citizenName = this.citizenName;
		instance.citizenEmail = this.citizenEmail;
		instance.captchaToken = this.captchaToken;
		instance.reasonToReject = this.reasonToReject;
		instance.bookedSlots = this.slots;

		return instance;
	}
}

@Entity()
export class Booking {
	public copyNonIdValuesTo(_anotherBooking: Booking): void {
		// Excludes some properties
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { _version, _uuid, _id, _targetWorkflow, _onHoldRescheduleWorkflow, ...values } = this;
		// copies values
		Object.assign(_anotherBooking, values);
	}

	public copyOnHoldInformation(_targetBooking: Booking): void {
		_targetBooking.startDateTime = this.startDateTime;
		_targetBooking.endDateTime = this.endDateTime;
		_targetBooking.serviceId = this.serviceId;
		_targetBooking.serviceProviderId = this.serviceProviderId;
		_targetBooking.status = this.status;
		_targetBooking.onHoldUntil = this.onHoldUntil;
	}

	// _version is updated in an atomic DB operation (see repository)
	@Column({ update: false })
	public _version: number;

	@Column({ type: 'uuid' })
	@Index({ unique: true })
	@Generated('uuid')
	public _uuid: string;

	@PrimaryGeneratedColumn()
	private _id: number;

	@Column({ nullable: false })
	@Index()
	private _serviceId: number;

	@Column({ nullable: false })
	private _creatorId: number;

	@ManyToOne(() => Service)
	@JoinColumn({ name: '_serviceId' })
	private _service: Service;

	@Column({ nullable: true })
	@Index()
	private _eventId: number;

	@ManyToOne(() => Event, { nullable: true })
	@JoinColumn({ name: '_eventId' })
	private _event: Event;

	@Column()
	private _status: BookingStatus;

	@OneToMany(() => BookedSlot, (bookedSlot) => bookedSlot.booking, { cascade: true })
	public bookedSlots: BookedSlot[];

	@Column()
	@Index()
	private _startDateTime: Date;

	@Column()
	@Index()
	private _endDateTime: Date;

	@Column({ nullable: true })
	private _refId?: string;

	@ManyToOne(() => ServiceProvider, { nullable: true })
	@JoinColumn({ name: '_serviceProviderId' })
	private _serviceProvider: ServiceProvider;

	@Column({ nullable: true })
	@Index()
	private _serviceProviderId?: number;

	@ManyToOne(() => User, { nullable: false })
	@JoinColumn({ name: '_creatorId' })
	private _creator: User;

	@Column({ nullable: true })
	private _citizenName: string;

	@Column({ nullable: true, type: 'varchar', length: 20 })
	@Index()
	private _citizenUinFin: string;
	@Column({ nullable: true })
	private _location: string;

	@Column({ nullable: true })
	private _citizenPhone: string;

	@Column({ nullable: true })
	@Index()
	private _onHoldUntil: Date;

	@Column({ nullable: true })
	private _description: string;

	@Column({ nullable: true })
	private _citizenEmail: string;

	@Column({ nullable: true })
	private _videoConferenceUrl: string;

	@Column({ nullable: true })
	private _reasonToReject: string;

	@OneToMany(() => BookingWorkflow, (e) => e._target)
	private _targetWorkflow: BookingWorkflow[];

	@OneToOne(() => BookingWorkflow, (e) => e._onHoldReschedule, { nullable: true })
	private _onHoldRescheduleWorkflow: BookingWorkflow;

	public get targetWorkflow(): BookingWorkflow[] {
		return this._targetWorkflow;
	}

	public get onHoldRescheduleWorkflow(): BookingWorkflow | null {
		return this._onHoldRescheduleWorkflow;
	}

	public get uuid(): string {
		return this._uuid;
	}

	public set uuid(value: string) {
		this._uuid = value;
	}

	public get onHoldUntil(): Date {
		return this._onHoldUntil;
	}
	public set onHoldUntil(value: Date) {
		this._onHoldUntil = value;
	}

	public get citizenPhone(): string {
		return this._citizenPhone;
	}

	public set citizenPhone(citizenPhone: string) {
		this._citizenPhone = citizenPhone;
	}

	// This is a virtual field.
	private _createdLog?: BookingChangeLog;
	public get createdLog(): BookingChangeLog | undefined {
		return this._createdLog;
	}
	public set createdLog(value: BookingChangeLog) {
		this._createdLog = value;
	}

	constructor() {
		this._version = 1;
	}

	public markOnHold(): void {
		this._status = BookingStatus.OnHold;
		this._onHoldUntil = new Date();
		this._onHoldUntil.setMinutes(this._onHoldUntil.getMinutes() + HOLD_DURATION_IN_MINS);
	}

	public expireOnHold(): void {
		this._onHoldUntil = new Date();
		this._onHoldUntil.setMinutes(this._onHoldUntil.getMinutes() - HOLD_DURATION_IN_MINS);
	}

	public setAutoAccept({ autoAccept }: { autoAccept: boolean }): void {
		this._status = autoAccept ? BookingStatus.Accepted : BookingStatus.PendingApproval;
	}

	public setPendingSA(): void {
		this._status = BookingStatus.PendingApprovalSA;
	}

	public static createNew({ creator }: { creator: User }): Booking {
		const instance = new Booking();
		instance._creator = creator;

		return instance;
	}

	public get citizenName(): string {
		return this._citizenName;
	}

	public set citizenName(citizenName: string) {
		this._citizenName = citizenName;
	}

	public get id(): number {
		return this._id;
	}

	public set id(value: number) {
		this._id = value;
	}

	public get creatorId(): number {
		return this._creatorId;
	}

	public set creatorId(value: number) {
		this._creatorId = value;
	}

	public get serviceId(): number {
		return this._serviceId;
	}

	public set serviceId(value: number) {
		this._serviceId = value;
	}

	public get service(): Service {
		return this._service;
	}

	public set service(value: Service) {
		this._service = value;
	}

	public get eventId() {
		return this._eventId;
	}

	public set eventId(eventId: number) {
		this._eventId = eventId;
	}

	public get event() {
		return this._event;
	}

	public set event(value: Event) {
		this._event = value;
	}

	public get status(): BookingStatus {
		return this._status;
	}

	public set status(newStatus: BookingStatus) {
		this._status = newStatus;
	}

	public get description(): string {
		return this._description;
	}

	public set description(description: string) {
		this._description = description;
	}

	public get startDateTime(): Date {
		return this._startDateTime;
	}

	public set startDateTime(startDateTime: Date) {
		this._startDateTime = startDateTime;
	}

	public get endDateTime(): Date {
		return this._endDateTime;
	}

	public set endDateTime(endDateTime: Date) {
		this._endDateTime = endDateTime;
	}

	public get serviceProvider(): ServiceProvider {
		return this._serviceProvider;
	}

	public set serviceProvider(serviceProvider: ServiceProvider) {
		this._serviceProvider = serviceProvider;
	}

	public set serviceProviderId(value: number | undefined) {
		this._serviceProviderId = value;
	}

	public get serviceProviderId(): number | undefined {
		return this._serviceProviderId;
	}

	public get creator(): User {
		return this._creator;
	}

	public set creator(value: User) {
		this._creator = value;
	}

	public get citizenUinFin(): string {
		return this._citizenUinFin;
	}

	public set citizenUinFin(value: string) {
		this._citizenUinFin = value;
	}

	public get refId(): string {
		return this._refId;
	}

	public set refId(refId: string) {
		this._refId = refId;
	}

	public get citizenEmail(): string {
		return this._citizenEmail;
	}

	public set citizenEmail(citizenEmail: string) {
		this._citizenEmail = citizenEmail;
	}

	public get reasonToReject(): string {
		return this._reasonToReject;
	}

	public set reasonToReject(reasonToReject: string) {
		this._reasonToReject = reasonToReject;
	}

	public get location(): string {
		return this._location;
	}

	public set location(location: string) {
		this._location = location;
	}

	private _captchaToken: string;

	public get captchaToken(): string {
		return this._captchaToken;
	}
	public set captchaToken(value: string) {
		this._captchaToken = value;
	}

	public get videoConferenceUrl(): string {
		return this._videoConferenceUrl;
	}
	public set videoConferenceUrl(value: string) {
		this._videoConferenceUrl = value;
	}

	public clone(): Booking {
		const instance = new Booking();
		Object.assign(instance, this);
		return instance;
	}

	public bookingIntersects(other: { start: Date; end: Date; id?: number }): boolean {
		if (!other.start || !other.end || (other.id && other.id === this.id)) {
			return false;
		}
		return timeSpan.intersectsDateTimeSpan(other, this.startDateTime, this.endDateTime);
	}

	public bookingIntersectsNative(start: number, end: number, id?: number): boolean {
		if (!start || !end || (id && id === this.id)) {
			return false;
		}
		return timeSpan.intersectsDateTimeNative(start, end, this.startDateTime.getTime(), this.endDateTime.getTime());
	}

	public getUpdateChangeType(previousBooking?: Booking): ChangeLogAction {
		if (
			!DateHelper.equals(this.startDateTime, previousBooking.startDateTime) ||
			!DateHelper.equals(this.endDateTime, previousBooking.endDateTime)
		) {
			return ChangeLogAction.Reschedule;
		} else {
			return ChangeLogAction.Update;
		}
	}

	public isValidForRescheduling(): boolean {
		return this.status === BookingStatus.Accepted || this.status === BookingStatus.PendingApproval;
	}

	public isValidOnHoldBooking(): boolean {
		return this.status === BookingStatus.OnHold && this.onHoldUntil > new Date();
	}

	@Column({ type: 'jsonb', nullable: false, default: '[]' })
	private _dynamicValues: DynamicValueJsonModel[];

	public get dynamicValues(): DynamicValueJsonModel[] {
		return this._dynamicValues;
	}

	public set dynamicValues(value: DynamicValueJsonModel[]) {
		this._dynamicValues = value;
	}
}
