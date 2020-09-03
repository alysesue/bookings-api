import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BookingStatus } from "../bookingStatus";
import { ServiceProvider } from './serviceProvider';
import { Service } from "./service";
import * as timeSpan from "../../tools/timeSpan";

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

	@Column({ nullable: true })
	private _refId?: string;

	@ManyToOne(type => ServiceProvider, { nullable: true })
	@JoinColumn({ name: '_serviceProviderId' })
	private _serviceProvider: ServiceProvider;

	@Column({ nullable: true })
	private _serviceProviderId?: number;

	@Column({ nullable: true, type: "varchar", length: 20 })
	@Index()
	private _citizenUinFin: string;

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

	public set service(value: Service) {
		this._service = value;
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

	public get citizenUinFin(): string {
		return this._citizenUinFin;
	}

	public set citizenUinFin(value: string) {
		this._citizenUinFin = value;
	}

	public bookingIntersects(other: { start: Date, end: Date }): boolean {
		if (!other.start || !other.end) {
			return false;
		}
		return timeSpan.intersectsDateTimeSpan(other, this.startDateTime, this.endDateTime);
	}

	public static create(serviceId: number, startDateTime: Date, endDateTime: Date, serviceProviderId?: number, refId?: string) {
		const instance = new Booking();
		instance._serviceId = serviceId;
		instance._startDateTime = startDateTime;
		instance._endDateTime = endDateTime;
		instance._refId = refId;

		if (serviceProviderId) {
			instance._serviceProviderId = serviceProviderId;
			instance._status = BookingStatus.Accepted;
		} else {
			instance._status = BookingStatus.PendingApproval;
		}

		return instance;
	}
}
