import {Booking, User} from '../../models/entities';
import { Subject } from '../../infrastructure/observer';
import { InRequestScope } from 'typescript-ioc';
import {BookingType} from "../../models/bookingType";

export type BookingsPublisherProps = {
	booking: Booking,
	bookingType?: BookingType,
	userType?: User,
};

@InRequestScope
export class BookingsSubject extends Subject<BookingsPublisherProps> {
	private _booking: Booking;
	private _bookingType: BookingType;
	private _userType: User;

	public get booking(): BookingsPublisherProps {
		return {
			booking: this._booking,
			bookingType: this._bookingType,
			userType: this._userType,
		}
	}

	public notify(props: BookingsPublisherProps): void {
		this._booking = props.booking;
		this._bookingType = props.bookingType;
		this._userType = props.userType;
		super.notify(props);
	}
}
