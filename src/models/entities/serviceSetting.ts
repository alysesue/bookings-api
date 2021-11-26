import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

enum BookingLimitation {
	NoLimitations = 'NoLimitations',
	OnlyOneBookingPerDate = 'OnlyOneBookingPerDate',
	OnlyOneUpcomingBooking = 'OnlyOneUpcomingBooking',
}

@Entity()
export class ServiceSetting {
	public constructor() {}

	@PrimaryGeneratedColumn()
	private _id: number;

	public set id(id: number) {
		this._id = id;
	}

	public get id(): number {
		return this._id;
	}

	@Column({ default: BookingLimitation.NoLimitations })
	private _bookingLimitation: BookingLimitation;

	public set bookingLimitation(value: BookingLimitation) {
		this._bookingLimitation = value;
	}
	public get bookingLimitation(): BookingLimitation {
		return this._bookingLimitation;
	}

	@Column({ nullable: true })
	private _limitationNumber: number;

	public set limitationNumber(value: number) {
		this._limitationNumber = value;
	}

	public get limitationNumber(): number {
		return this._limitationNumber;
	}
}
