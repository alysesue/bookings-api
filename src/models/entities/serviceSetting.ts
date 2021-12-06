import { BookingLimitation, BookingLimitationType } from '../../components/services/service.apicontract';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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
	protected _bookingLimitation: BookingLimitation;
	public set bookingLimitation(value: BookingLimitation) {
		this._bookingLimitation = value;
	}
	public get bookingLimitation(): BookingLimitation {
		return this._bookingLimitation;
	}

	public static create(bookingLimitation?: BookingLimitation) {
		const serviceSetting = new ServiceSetting();
		const bookingLimitationObj: BookingLimitation = {};
		if (bookingLimitation && bookingLimitation.bookingLimitationType)
			bookingLimitationObj.bookingLimitationType = bookingLimitation.bookingLimitationType;
		else bookingLimitationObj.bookingLimitationType = BookingLimitationType.NoLimitations;
		if (bookingLimitation && bookingLimitation.bookingLimitationNumber)
			bookingLimitationObj.bookingLimitationNumber = bookingLimitation.bookingLimitationNumber;
		else bookingLimitationObj.bookingLimitationNumber = 1;
		serviceSetting.bookingLimitation = bookingLimitationObj;
		return serviceSetting;
	}
}
