import { InRequestScope } from 'typescript-ioc';
import { Booking } from '../../models/entities';
import { Subject } from '../../infrastructure/observer';
import { BookingType } from '../../models/bookingType';
import { ExternalAgencyAppointmentJobAction } from '../lifesg/lifesg.apicontract';
import { BookingStatus } from '../../models';

export type BookingsPublisherProps = {
	booking: Booking;
	bookingType?: BookingType;
	action?: ExternalAgencyAppointmentJobAction;
};

@InRequestScope
export class BookingsSubject extends Subject<BookingsPublisherProps> {
	private _booking: Booking;
	private _bookingType: BookingType;
	private _action?: ExternalAgencyAppointmentJobAction;

	public get bookingType(): BookingType {
		return this._bookingType;
	}
	public get booking(): Booking {
		return this._booking;
	}

	public get action(): ExternalAgencyAppointmentJobAction {
		return this._action;
	}

	public notify(props: BookingsPublisherProps): void {
		if (props.booking.status !== BookingStatus.OnHold) {
			this._booking = props.booking;
			this._bookingType = props.bookingType;
			this._action = props?.action;
			super.notify(props);
		}
	}
}
