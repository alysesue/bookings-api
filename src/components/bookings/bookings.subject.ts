import { Booking } from '../../models/entities';
import { Subject } from '../../infrastructure/observer';
import { InRequestScope } from "typescript-ioc";

export type BookingsPublisherProps = { booking: Booking };

@InRequestScope
export class BookingsSubject extends Subject<BookingsPublisherProps> {
	private _booking: Booking;

	public get booking(): Booking {
		return this._booking;
	}

	public notify(props: BookingsPublisherProps): void {
		this._booking = props.booking;
		super.notify(props);
	}
}
