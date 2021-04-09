import { Booking } from '../../../models';
import { BookingsSubject } from '../bookings.subject';

export class BookingsSubjectMock extends BookingsSubject {
	public static notifyMock = jest.fn();
	public get booking(): Booking {
		return ({
			_status: 2,
			status: 2,
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

	public notify(...params): void {
		return BookingsSubjectMock.notifyMock(...params);
	}
}
