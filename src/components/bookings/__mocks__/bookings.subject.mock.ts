import { Booking } from '../../../models/entities';
import { BookingsSubject } from '../bookings.subject';

export class BookingsSubjectMock extends BookingsSubject {
	public get booking(): Booking {
		return {} as Booking;
	}

	public notify(...params): void {}
}
