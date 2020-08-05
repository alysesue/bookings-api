import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BookingStatus } from "../bookingStatus";
import { ServiceProvider } from './serviceProvider';
import { Service } from "./service";
import * as timeSpan from "../../tools/timeSpan";

@Entity()
export class Booking {
	constructor() {
	}

	public static create(serviceId: number, startDateTime: Date, endDateTime: Date, serviceProviderId?: number, refId?: string) {
		const instance = new Booking();
		instance._serviceId = serviceId;
		instance._startDateTime = startDateTime;
		instance._endDateTime = endDateTime;
		instance._createdAt = new Date();
		instance._refId = refId;

		if (serviceProviderId) {
			instance._serviceProviderId = serviceProviderId;
			instance._status = BookingStatus.Accepted;
			instance._acceptedAt = instance.createdAt;
		} else {
			instance._status = BookingStatus.PendingApproval;
		}

		return instance;
	}

	@PrimaryGeneratedColumn()
	private _id: number;

	public get id(): number {
		return this._id;
	}

	@Column({ nullable: false })
	private _serviceId: number;

	public get serviceId(): number {
		return this._serviceId;
	}

	@ManyToOne(type => Service)
	@JoinColumn({ name: '_serviceId' })
	private _service: Service;

	public get service(): Service {
		return this._service;
	}

	@Column({ type: "varchar", length: 300, nullable: true })
	private _eventICalId: string;

	public get eventICalId(): string {
		return this._eventICalId;
	}

	public set eventICalId(value: string) {
		this._eventICalId = value;
	}

	@Column()
	private _status: BookingStatus;

	public get status(): BookingStatus {
		return this._status;
	}

	public set status(newStatus: BookingStatus) {
		this._status = newStatus;
	}

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

	public get startDateTime(): Date {
		return this._startDateTime;
	}

	public get endDateTime(): Date {
		return this._endDateTime;
	}

	@Column({ nullable: true })
	private _acceptedAt: Date;

	public set acceptedAt(acceptedAt: Date) {
		this._acceptedAt = acceptedAt;
	}

	@ManyToOne(type => ServiceProvider, { nullable: true })
	@JoinColumn({ name: '_serviceProviderId' })
	private _serviceProvider: ServiceProvider;

	@Column({ nullable: true })
	private _serviceProviderId?: number;

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
	public get createdAt(): Date {
		return this._createdAt;
	}

	public bookingIntersects(other: {start: Date, end: Date} ): boolean {
		if (!other.start || !other.end) {
			return false;
		}
		return timeSpan.intersectsDateTimeSpan(other, this.startDateTime, this.endDateTime)
	}
}
