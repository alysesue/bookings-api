import { Booking } from '../../models';
import { Subject } from '../../infrastructure/observer';
import { InRequestScope } from 'typescript-ioc';
import { BookingType } from '../../models/bookingType';

export type BookingsPublisherProps = {
	booking: Booking;
	bookingType?: BookingType;
};

@InRequestScope
export class BookingsSubject extends Subject<BookingsPublisherProps> {
	private _booking: Booking;
	private _bookingType: BookingType;

	public get booking(): BookingsPublisherProps {
		return {
			booking: this._booking,
			bookingType: this._bookingType,
		};
	}

	public notify(props: BookingsPublisherProps): void {
		this._booking = props.booking;
		this._bookingType = props.bookingType;
		super.notify(props);
	}
}
