import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { BookingStatus } from "./bookingStatus";

@Entity()
export class Booking extends BaseEntity {
	@PrimaryGeneratedColumn()
	protected id: number;

	@Column()
	protected status: BookingStatus;

	@Column()
	protected startDateTime: Date;
	@Column()
	protected sessionDurationInMinutes: number;

	constructor(startDateTime: Date, sessionDurationInMinutes: number) {
		super();
		this.startDateTime = startDateTime;
		this.sessionDurationInMinutes = sessionDurationInMinutes;
		this.status = BookingStatus.PendingApproval;
	}

	public getStatus() {
		return this.status;
	}
}
