import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BookingStatus } from "../bookingStatus";
import { ServiceProvider } from './serviceProvider';
import { Service } from "./service";
import * as timeSpan from "../../tools/timeSpan";
import { User } from "./user";

@Entity()
export class Booking {

	@PrimaryGeneratedColumn()
	private _id: number;

	@Column({ nullable: false })
	private _serviceId: number;

	@ManyToOne(type => Service)
	@JoinColumn({ name: '_serviceId' })
	private _service: Service;

	@Column({ type: "varchar", length: 300, nullable: true })
	private _eventICalId: string;

	@Column()
	private _status: BookingStatus;

	@Column()
	@Index()
	private _startDateTime: Date;

	@Column()
	@Index()
	private _endDateTime: Date;

	@Column()
	private _createdAt: Date;

	@Column({ nullable: true })
	private _refId?: string;

	@Column({ nullable: true })
	private _acceptedAt: Date;

	@ManyToOne(type => ServiceProvider, { nullable: true })
	@JoinColumn({ name: '_serviceProviderId' })
	private _serviceProvider: ServiceProvider;

	@Column({ nullable: true })
	private _serviceProviderId?: number;

	@ManyToOne(type => User, { cascade: true, nullable: true })
	@JoinColumn({ name: '_citizenUserId' })
	private _citizenUser: User;

	@Column({ nullable: true })
	private _citizenUserId: number;

	public get citizenUserId(): number {
		return this._citizenUserId;
	}

	public set citizenUserId(value: number) {
		this._citizenUserId = value;
	}

	constructor() {
	}

	public get id(): number {
		return this._id;
	}

	public get serviceId(): number {
		return this._serviceId;
	}

	public get service(): Service {
		return this._service;
	}

	public get eventICalId(): string {
		return this._eventICalId;
	}

	public set eventICalId(value: string) {
		this._eventICalId = value;
	}

	public get status(): BookingStatus {
		return this._status;
	}

	public set status(newStatus: BookingStatus) {
		this._status = newStatus;
	}

	public get startDateTime(): Date {
		return this._startDateTime;
	}

	public get endDateTime(): Date {
		return this._endDateTime;
	}

	public set acceptedAt(acceptedAt: Date) {
		this._acceptedAt = acceptedAt;
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

	public get citizenUser(): User {
		return this._citizenUser;
	}

	public set citizenUser(value: User) {
		this._citizenUser = value;
	}

	public get createdAt(): Date {
		return this._createdAt;
	}

	public bookingIntersects(other: { start: Date, end: Date }): boolean {
		if (!other.start || !other.end) {
			return false;
		}
		return timeSpan.intersectsDateTimeSpan(other, this.startDateTime, this.endDateTime);
	}

	public static create(serviceId: number, startDateTime: Date, endDateTime: Date, serviceProviderId?: number, refId?: string, eventICalId?: string) {
		const instance = new Booking();
		instance._serviceId = serviceId;
		instance._startDateTime = startDateTime;
		instance._endDateTime = endDateTime;
		instance._createdAt = new Date();
		instance._refId = refId;
		instance._eventICalId = eventICalId;

		if (serviceProviderId) {
			instance._serviceProviderId = serviceProviderId;
			instance._status = BookingStatus.Accepted;
			instance._acceptedAt = instance.createdAt;
		} else {
			instance._status = BookingStatus.PendingApproval;
		}

		return instance;
	}
}
