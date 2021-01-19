import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BookingStatus } from '../bookingStatus';
import { ServiceProvider } from './serviceProvider';
import { Service } from './service';
import * as timeSpan from '../../tools/timeSpan';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { User } from './user';
import { ChangeLogAction } from '../changeLogAction';
import { DateHelper } from '../../infrastructure/dateHelper';

export const BookingIsolationLevel: IsolationLevel = 'READ COMMITTED';

export class BookingBuilder {
	public serviceId: number;
	public startDateTime: Date;
	public endDateTime: Date;
	public refId: string;
	public location: string;
	public description: string;
	public serviceProviderId: number;
	public creator: User;
	public citizenUinFin: string;
	public citizenPhone: string;
	public citizenName: string;
	public citizenEmail: string;
	public autoAccept: boolean;
	public captchaToken: string;
	public captchaOrigin: string;
	public markOnHold: boolean;

	public withServiceId(serviceId: number): BookingBuilder {
		this.serviceId = serviceId;
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

	public withAutoAccept(autoAccept: boolean): BookingBuilder {
		this.autoAccept = !!autoAccept;
		return this;
	}
	public withCaptchaToken(captchaToken: string): BookingBuilder {
		this.captchaToken = captchaToken;
		return this;
	}
	public withCaptchaOrigin(captchaOrigin: string): BookingBuilder {
		this.captchaOrigin = captchaOrigin;
		return this;
	}

	public withMarkOnHold(markOnHold: boolean): BookingBuilder {
		this.markOnHold = markOnHold;
		return this;
	}

	public build(): Booking {
		return Booking.create(this);
	}
}

@Entity()
export class Booking {
	// _version is updated in an atomic DB operation (see repository)
	@Column({ update: false })
	public _version: number;

	@PrimaryGeneratedColumn()
	private _id: number;

	@Column({ nullable: false })
	@Index()
	private _serviceId: number;

	@ManyToOne((type) => Service)
	@JoinColumn({ name: '_serviceId' })
	private _service: Service;

	@Column()
	private _status: BookingStatus;

	@Column()
	@Index()
	private _startDateTime: Date;

	@Column()
	@Index()
	private _endDateTime: Date;

	@Column({ nullable: true })
	private _refId?: string;

	@ManyToOne((type) => ServiceProvider, { nullable: true })
	@JoinColumn({ name: '_serviceProviderId' })
	private _serviceProvider: ServiceProvider;

	@Column({ nullable: true })
	@Index()
	private _serviceProviderId?: number;

	@ManyToOne((type) => User, { nullable: false })
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

	constructor() {
		this._version = 1;
	}

	public static create(builder: BookingBuilder): Booking {
		const HOLD_DURATION_IN_MINS = 5;
		const instance = new Booking();
		if (builder.serviceProviderId) {
			instance._serviceProviderId = builder.serviceProviderId;
			if (builder.markOnHold) {
				instance._status = BookingStatus.OnHold;
				instance._onHoldUntil = new Date();
				instance._onHoldUntil.setMinutes(instance._onHoldUntil.getMinutes() + HOLD_DURATION_IN_MINS);
			} else {
				instance._status = builder.autoAccept ? BookingStatus.Accepted : BookingStatus.PendingApproval;
			}
		} else {
			instance._status = BookingStatus.PendingApproval;
		}
		instance._serviceId = builder.serviceId;
		instance._startDateTime = builder.startDateTime;
		instance._endDateTime = builder.endDateTime;
		instance._refId = builder.refId;
		instance._location = builder.location;
		instance._description = builder.description;
		instance._creator = builder.creator;
		instance._citizenUinFin = builder.citizenUinFin;
		instance._citizenPhone = builder.citizenPhone;
		instance._citizenName = builder.citizenName;
		instance._citizenEmail = builder.citizenEmail;
		instance._captchaToken = builder.captchaToken;
		instance._captchaOrigin = builder.captchaOrigin;

		return instance;
	}

	@Column({ nullable: true })
	private _description: string;

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

	public get serviceId(): number {
		return this._serviceId;
	}

	public get service(): Service {
		return this._service;
	}

	public set service(value: Service) {
		this._service = value;
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

	@Column({ nullable: true })
	private _citizenEmail: string;

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

	private _captchaOrigin: string;

	public get captchaOrigin(): string {
		return this._captchaOrigin;
	}
	public set captchaOrigin(value: string) {
		this._captchaOrigin = value;
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
}
