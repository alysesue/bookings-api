import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BookingLimitationType } from '../bookingLimitationType';

// For new service settings that are not `boolean`, should be added here
export enum BookingLimitation {
	NoLimitations = 'NoLimitations',
	LimitedBookingPerDate = 'LimitedBookingPerDate',
	LimitedUpcomingBooking = 'LimitedUpcomingBooking',
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
	private _bookingLimitationType: BookingLimitationType;

	public set bookingLimitationType(value: BookingLimitationType) {
		this._bookingLimitationType = value;
	}
	public get bookingLimitationType(): BookingLimitationType {
		return this._bookingLimitationType;
	}

	@Column({ nullable: true })
	private _bookingLimitationNumber: number;

	public set bookingLimitationNumber(value: number) {
		this._bookingLimitationNumber = value;
	}

	public get bookingLimitationNumber(): number {
		return this._bookingLimitationNumber;
	}

	public static create(bookingLimitationType?: BookingLimitationType, bookingLimitationNumber?: number) {
		const serviceSetting = new ServiceSetting();
		if (bookingLimitationType) serviceSetting._bookingLimitationType = bookingLimitationType;
		else serviceSetting._bookingLimitationType = BookingLimitationType.NoLimitations;
		serviceSetting._bookingLimitationNumber = bookingLimitationNumber;
		return serviceSetting;
	}
}
