import {BaseEntity, Column, Entity, PrimaryGeneratedColumn} from "typeorm";
import {BookingStatus} from "./bookingStatus";

@Entity()
export class Booking extends BaseEntity {
	constructor(startDateTime: Date, sessionDurationInMinutes: number) {
		super();
		this._startDateTime = startDateTime;
		this._sessionDurationInMinutes = sessionDurationInMinutes;
		this._status = BookingStatus.PendingApproval;
	}

	@PrimaryGeneratedColumn()
	private _id: number;

	public get id(): number {
		return this._id;
	}

	@Column({type: "varchar", length: 300, nullable: true})
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
	private _startDateTime: Date;

	public get startDateTime(): Date {
		return this._startDateTime;
	}

	@Column()
	private _sessionDurationInMinutes: number;

	public get sessionDurationInMinutes(): number {
		return this._sessionDurationInMinutes;
	}

	public getSessionEndTime(): Date {
		return new Date(
			this._startDateTime.getTime() + this._sessionDurationInMinutes * 60 * 1000
		);
	}
}
