import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { BookingStatus } from "./bookingStatus";

@Entity()
export class Booking extends BaseEntity {
	@PrimaryGeneratedColumn()
	private _id: number;

	@Column()
	private _status: BookingStatus;

	@Column()
	private _startDateTime: Date;
	@Column()
	private _sessionDurationInMinutes: number;

	constructor(startDateTime: Date, sessionDurationInMinutes: number) {
		super();
		this._startDateTime = startDateTime;
		this._sessionDurationInMinutes = sessionDurationInMinutes;
		this._status = BookingStatus.PendingApproval;
	}

	public get id(): number {
		return this._id;
	}

	public get status(): BookingStatus {
		return this._status;
	}

	public get startDateTime(): Date {
		return this._startDateTime;
	}

	public get sessionDurationInMinutes(): number {
		return this._sessionDurationInMinutes;
	}
}
