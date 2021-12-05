import { BookingLimitation, BookingLimitationType } from '../../components/services/service.apicontract';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BookingLimitationType } from '../bookingLimitationType';

// For new service settings that are not `boolean`, should be added here
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
	public get bookingLimitationType(): BookingLimitationType {
		return this._bookingLimitationType;
	}
	private static defaultBookingLimitation() {
		return {
			bookingLimitationType: BookingLimitationType.NoLimitation,
		} as BookingLimitation;
	}
	public static create(bookingLimitation?: BookingLimitation) {
		const serviceSetting = new ServiceSetting();
		if (!bookingLimitation) {
			serviceSetting.bookingLimitation = this.defaultBookingLimitation();
			return serviceSetting;
		}
		if (bookingLimitation.bookingLimitationType !== BookingLimitationType.NoLimitation) {
			bookingLimitation.bookingLimitationNumber = bookingLimitation.bookingLimitationNumber ?? 1;
		}
		serviceSetting.bookingLimitation = bookingLimitation;
		return serviceSetting;
	}

	public static create(bookingLimitationType?: BookingLimitationType, bookingLimitationNumber?: number) {
		const serviceSetting = new ServiceSetting();
		if (bookingLimitationType) serviceSetting._bookingLimitationType = bookingLimitationType;
		else serviceSetting._bookingLimitationType = BookingLimitationType.NoLimitations;
		serviceSetting._bookingLimitationNumber = bookingLimitationNumber;
		return serviceSetting;
	}
}
