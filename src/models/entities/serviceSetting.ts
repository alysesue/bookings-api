import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// For new service settings that are not `boolean`, should be added here
export enum BookingLimitation {
	NoLimitations = 'NoLimitations',
	LimitedBookingPerDate = 'LimitedBookingPerDate',
	LimitedUpcomingBooking = 'LimitedUpcomingBooking',
}

export type BookingLimitationType = {
	bookingLimitationType?: BookingLimitation;
	bookingLimitationNumber?: number;
};

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

	@Column({ type: 'jsonb', nullable: false, default: '{}' })
	protected _bookingLimitation: BookingLimitationType;
	public set bookingLimitation(value: BookingLimitationType) {
		this._bookingLimitation = value;
	}
	public get bookingLimitation(): BookingLimitationType {
		return this._bookingLimitation;
	}

	public static create(bookingLimitation?: BookingLimitationType) {
		const serviceSetting = new ServiceSetting();
		const bookingLimitationObj: BookingLimitationType = {};
		if (bookingLimitation && bookingLimitation.bookingLimitationType)
			bookingLimitationObj.bookingLimitationType = bookingLimitation.bookingLimitationType;
		else bookingLimitationObj.bookingLimitationType = BookingLimitation.NoLimitations;
		if (bookingLimitation && bookingLimitation.bookingLimitationNumber)
			bookingLimitationObj.bookingLimitationNumber = bookingLimitation.bookingLimitationNumber;
		else bookingLimitationObj.bookingLimitationNumber = 1;
		serviceSetting.bookingLimitation = bookingLimitationObj;
		return serviceSetting;
	}
}
