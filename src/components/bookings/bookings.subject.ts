import { InRequestScope } from 'typescript-ioc';
import { Booking } from '../../models/entities';
import { Subject } from '../../infrastructure/observer';
import { BookingType } from '../../models/bookingType';

export type BookingsPublisherProps = {
	booking: Booking;
	bookingType?: BookingType;
	action?: any
};

@InRequestScope
export class BookingsSubject extends Subject<BookingsPublisherProps> {
	private _booking: Booking;
	private _bookingType: BookingType;
	private _action?: any;

	public get bookingType(): BookingType {
		return this._bookingType;
	}
	public get booking(): Booking {
		return this._booking;
	}

	public get action(): any {
		return this._action;
	}

	public notify(props: BookingsPublisherProps): void {
		this._booking = props.booking;
		this._bookingType = props.bookingType;
		this._action = props?.action;
		super.notify(props);
	}
}
