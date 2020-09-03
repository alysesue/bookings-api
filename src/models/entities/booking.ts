import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BookingStatus } from "../bookingStatus";
import { ServiceProvider } from './serviceProvider';
import { Service } from "./service";
import * as timeSpan from "../../tools/timeSpan";
import { User } from "./user";


export class BookingBuilder {
	serviceId: number;
	startDateTime: Date;
	endDateTime: Date;
	refId: string;
	location: string;
	description: string;
	serviceProviderId: number;
	creator: User;
	citizenUinFin: string;

	withServiceId(serviceId: number): BookingBuilder {
		this.serviceId = serviceId;
		return this;
	}

	withStartDateTime(startDateTime: Date): BookingBuilder {
		this.startDateTime = startDateTime;
		return this;
	}

	withEndDateTime(endDateTime: Date): BookingBuilder {
		this.endDateTime = endDateTime;
		return this;
	}

	withRefId(refId: string): BookingBuilder {
		this.refId = refId;
		return this;
	}

	withLocation(location: string): BookingBuilder {
		this.location = location;
		return this;
	}

	withDescription(description: string): BookingBuilder {
		this.description = description;
		return this;
	}

	withServiceProviderId(serviceProviderId: number): BookingBuilder {
		this.serviceProviderId = serviceProviderId;
		return this;
	}

	withCreator(currentUser: User): BookingBuilder {
		this.creator = currentUser;
		return this;
	}

	withCitizenUinFin(citizenUinFin: string): BookingBuilder {
		this.citizenUinFin = citizenUinFin;
		return this;
	}

	build(): Booking {
		return new Booking(this);
	}
}


@Entity()
export class Booking {

	@PrimaryGeneratedColumn()
	private _id: number;

	@Column({nullable: false})
	private _serviceId: number;

	@ManyToOne(type => Service)
	@JoinColumn({name: '_serviceId'})
	private _service: Service;

	@Column({type: "varchar", length: 300, nullable: true})
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

	@Column({nullable: true})
	private _refId?: string;

	@Column({nullable: true})
	private _acceptedAt: Date;

	@ManyToOne(type => ServiceProvider, {nullable: true})
	@JoinColumn({name: '_serviceProviderId'})
	private _serviceProvider: ServiceProvider;

	@Column({nullable: true})
	private _serviceProviderId?: number;

	@ManyToOne(type => User, {nullable: false})
	@JoinColumn({name: '_creatorId'})
	private _creator: User;

	@Column({nullable: true, type: "varchar", length: 20})
	@Index()
	private _citizenUinFin: string;

	@Column({nullable: true})
	private _location: string;

	@Column({nullable: true})
	private _description: string;

	constructor(builder?: BookingBuilder) {
		if (builder) {
			this._createdAt = new Date();

			if (builder.serviceProviderId) {
				this._serviceProviderId = builder.serviceProviderId;
				this._status = BookingStatus.Accepted;
				this._acceptedAt = this._createdAt;
			} else {
				this._status = BookingStatus.PendingApproval;
			}
			this._serviceId = builder.serviceId;
			this._startDateTime = builder.startDateTime;
			this._endDateTime = builder.endDateTime;
			this._refId = builder.refId;
			this._location = builder.location;
			this._description = builder.description;
			this._creator = builder.creator;
			this._citizenUinFin = builder.citizenUinFin;
		}
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

	public get creator(): User {
		return this._creator;
	}

	public get createdAt(): Date {
		return this._createdAt;
	}

	public get citizenUinFin(): string {
		return this._citizenUinFin;
	}

	public bookingIntersects(other: { start: Date, end: Date }): boolean {
		if (!other.start || !other.end) {
			return false;
		}
		return timeSpan.intersectsDateTimeSpan(other, this.startDateTime, this.endDateTime);
	}
}
