import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { BookingStatus } from "./bookingStatus";

@Entity()
export class Booking extends BaseEntity {
  @PrimaryGeneratedColumn()
  private _id: number;

  @Column({ type: "varchar", length: 300, nullable: true })
  private _eventICalId: string;

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

  public get eventICalId(): string {
    return this._eventICalId;
  }

  public set eventICalId(value: string) {
    this._eventICalId = value;
  }

  public set status(newStatus: BookingStatus) {
    this._status = newStatus;
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

  public getSessionEndTime(): Date {
    return new Date(
      this._startDateTime.getTime() + this._sessionDurationInMinutes * 60 * 1000
    );
  }
}
