import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChangeLogAction } from '../changeLogAction';
import { IBooking } from '../interfaces';
import { User } from './user';
import { Service } from './service';
import { DynamicValueJsonModel } from './jsonModels';
import { BookedSlot } from './bookedSlot';

@Entity()
export class BookingChangeLog {
	@PrimaryGeneratedColumn()
	private _id: number;

	@Column()
	@Index()
	private _timestamp: Date;

	@Column({ nullable: false })
	@Index()
	private _serviceId: number;

	@ManyToOne(() => Service)
	@JoinColumn({ name: '_serviceId' })
	private _service: Service;

	@ManyToOne('Booking', { nullable: false })
	@JoinColumn({ name: '_bookingId' })
	private _booking: IBooking;

	@Column({ nullable: false })
	@Index()
	private _bookingId: number;

	@Column({ nullable: false })
	@Index()
	private _userId: number;

	@ManyToOne(() => User, { nullable: false })
	@JoinColumn({ name: '_userId' })
	private _user: User;

	@Column()
	private _action: ChangeLogAction;

	@Column({ type: 'jsonb', nullable: false })
	private _previousState: BookingJsonVersion & BookingJsonSchemaV1;

	@Column({ type: 'jsonb', nullable: false })
	private _newState: BookingJsonVersion & BookingJsonSchemaV1;

	public get userId(): number {
		return this._userId;
	}

	public get id(): number {
		return this._id;
	}

	public get timestamp(): Date {
		return this._timestamp;
	}

	public set timestamp(value: Date) {
		this._timestamp = value;
	}

	public get booking(): IBooking {
		return this._booking;
	}

	public get bookingId(): number {
		return this._bookingId;
	}

	public get user(): User {
		return this._user;
	}

	public get action(): ChangeLogAction {
		return this._action;
	}

	public get previousState(): BookingJsonSchemaV1 {
		return this._previousState;
	}

	public setPreviousState(value: BookingJsonSchemaV1) {
		this._previousState = { schemaVersion: 1, ...value };
	}

	public get newState(): BookingJsonSchemaV1 {
		return this._newState;
	}

	public setNewState(value: BookingJsonSchemaV1) {
		this._newState = { schemaVersion: 1, ...value };
	}

	public get serviceId(): number {
		return this._serviceId;
	}

	public get service(): Service {
		return this._service;
	}

	constructor() {}

	public static create({
		booking,
		user,
		action,
		previousState,
		newState,
	}: {
		booking: IBooking;
		user: User;
		action: ChangeLogAction;
		previousState: BookingJsonSchemaV1;
		newState: BookingJsonSchemaV1;
	}): BookingChangeLog {
		const instance = new BookingChangeLog();
		instance._timestamp = new Date();
		instance._serviceId = booking.serviceId;
		instance._booking = booking;
		instance._user = user;
		instance._action = action;
		instance.setPreviousState(previousState);
		instance.setNewState(newState);

		return instance;
	}
}

type BookingJsonVersion = {
	schemaVersion: number;
};

class BookingJsonSchemaBase {
	public status?: number;
	public startDateTime?: Date;
	public endDateTime?: Date;
	public serviceName?: string;
	public serviceProviderAgencyUserId?: string;
	public serviceProviderName?: string;
	public serviceProviderEmail?: string;
	public serviceProviderPhone?: string;
	public citizenUinFin?: string;
	public citizenName?: string;
	public citizenEmail?: string;
	public citizenPhone?: string;
	public location?: string;
	public description?: string;
	public videoConferenceUrl?: string;
	public refId?: string;
	public dynamicValues?: DynamicValueJsonModel[];
	public serviceProviderAliasName?: string;
	public bookedSlots?: BookedSlot[];
}

export class BookingJsonSchemaV1 extends BookingJsonSchemaBase {
	public id?: number;
	public serviceId?: number;
	public serviceProviderId?: number;
}

export class BookingJsonSchemaV2 extends BookingJsonSchemaBase {
	public id?: string;
	public serviceId?: string;
	public serviceProviderId?: string;
}
