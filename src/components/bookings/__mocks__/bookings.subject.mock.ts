import { Booking } from '../../../models/entities';
import { BookingsSubject } from '../bookings.subject';

export class BookingsSubjectMock extends BookingsSubject {
	public get booking(): Booking {
		return ({
			_status: 1,
			_service: {
				_name: 'name',
			},
			_serviceProvider: {
				_name: 'name',
			},
			_citizenEmail: 'email',
			_location: 'location',
			_startDateTime: new Date(),
			_endDateTime: new Date(),
		} as unknown) as Booking;
	}

	public notify(...params): void {}
}
