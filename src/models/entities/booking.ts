import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BookingStatus } from "../bookingStatus";
import { ServiceProvider } from './serviceProvider';
import { Service } from "./service";

@Entity()
export class Booking extends BaseEntity {

	constructor(serviceId: number, startDateTime: Date, sessionDurationInMinutes: number) {
		super();
		this._serviceId = serviceId;
		this._startDateTime = startDateTime;
		this._sessionDurationInMinutes = sessionDurationInMinutes;

		this._status = BookingStatus.PendingApproval;
		this._createdAt = new Date();
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
	private _sessionDurationInMinutes: number;

	@Column()
	@Index()
	private _startDateTime: Date;

	@Column()
	private _createdAt: Date;

	public get startDateTime(): Date {
		return this._startDateTime;
	}

	@Column({ nullable: true })
	private _acceptedAt: Date;

	public set acceptedAt(acceptedAt: Date) {
		this._acceptedAt = acceptedAt;
	}

	public get sessionDurationInMinutes(): number {
		return this._sessionDurationInMinutes;
	}

	public getSessionEndTime(): Date {
		return new Date(
			this._startDateTime.getTime() + this._sessionDurationInMinutes * 60 * 1000
		);
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
}
