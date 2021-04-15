import { Booking } from '../../../models';
import { BookingsPublisherProps, BookingsSubject } from '../bookings.subject';

export class BookingsSubjectMock extends BookingsSubject {
	public static notifyMock = jest.fn();
	public get booking(): BookingsPublisherProps {
		return {
			booking: ({
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
			} as unknown) as Booking,
		};
	}
	public notify(...params): void {
		return BookingsSubjectMock.notifyMock(...params);
	}
}
