import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BookingStatus } from "./bookingStatus";
import { Calendar } from '../models/calendar';
import { textChangeRangeIsUnchanged } from "typescript";

@Entity()
export class Booking extends BaseEntity {

	constructor(startDateTime: Date, sessionDurationInMinutes: number) {
		super();
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

	@ManyToOne(type => Calendar, { nullable: true })
	@JoinColumn({ name: '_calendarId' })
	private _calendar: Calendar;

	@Column()
	private _calendarId?: number;

	public get calendar(): Calendar {
		return this._calendar;
	}

	public set calendar(calendar: Calendar) {
		this._calendar = calendar;
		if (calendar && calendar.id !== 0) {
			this._calendarId = calendar.id;
		}
	}

	public get calendarId(): number | undefined {
		return this._calendarId;
	}
}
