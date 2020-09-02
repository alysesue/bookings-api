import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user";
import { Booking } from "./booking";

@Entity()
export class BookingChangeLog {

	@PrimaryGeneratedColumn()
	private _id: number;

	@Column()
	@Index()
	private _timestamp: Date;

	@ManyToOne(type => Booking, { nullable: false, cascade: true })
	@JoinColumn({ name: '_bookingId' })
	private _booking: Booking;

	@ManyToOne(type => User, { nullable: false })
	@JoinColumn({ name: '_userId' })
	private _user: User;

	@Column()
	private _action: ChangeLogAction;

	@Column({ type: "jsonb", nullable: false })
	private _previousState: BookingJsonVersion;

	@Column({ type: "jsonb", nullable: false })
	private _newState: BookingJsonVersion;

	public get id(): number {
		return this._id;
	}

	public get timestamp(): Date {
		return this._timestamp;
	}

	public get booking(): Booking {
		return this._booking;
	}

	public get user(): User {
		return this._user;
	}

	public get action(): ChangeLogAction {
		return this._action;
	}

	public get previousState(): BookingJsonSchemaV1 {
		if (this._previousState.schemaVersion === 1) {
			return this._previousState as unknown as BookingJsonSchemaV1;
		} else {
			throw new Error('Unexpected booking json schema version: ' + this._previousState.schemaVersion);
		}
	}

	public setPreviousState(value: BookingJsonSchemaV1) {
		this._previousState = { schemaVersion: 1, ...value };
	}

	public get newState(): BookingJsonSchemaV1 {
		if (this._newState.schemaVersion === 1) {
			return this._newState as unknown as BookingJsonSchemaV1;
		} else {
			throw new Error('Unexpected booking json schema version: ' + this._newState.schemaVersion);
		}
	}

	public setNewState(value: BookingJsonSchemaV1) {
		this._newState = { schemaVersion: 1, ...value };
	}

	constructor() { }

	public static create({ booking, user, action, previousState, newState }: {
		booking: Booking,
		user: User,
		action: ChangeLogAction,
		previousState: BookingJsonSchemaV1,
		newState: BookingJsonSchemaV1,
	}): BookingChangeLog {
		const instance = new BookingChangeLog();
		instance._timestamp = new Date();
		instance._booking = booking;
		instance._user = user;
		instance._action = action;
		instance.setPreviousState(previousState);
		instance.setNewState(newState);

		return instance;
	}
}

type BookingJsonVersion = {
	schemaVersion: number
};

export type BookingJsonSchemaV1 = {
	id?: number;
	status: number;
	startDateTime: Date;
	endDateTime: Date;
	serviceId: number;
	serviceName: string;
	serviceProviderId?: number;
	serviceProviderName?: string;
	serviceProviderEmail?: string;
	serviceProviderPhone?: string;
	CitizenUinFin: string;
	CitizenName: string;
	CitizenEmail: string;
	CitizenPhone: string;
	Location: string;
	Description: string;
};

export enum ChangeLogAction {
	Create = 1,
	Accept,
	Reject,
	Cancel,
	Update,
	Reschedule
}
