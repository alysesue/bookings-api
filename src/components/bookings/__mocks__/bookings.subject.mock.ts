import { Booking, BookingStatus } from '../../../models';
import { MqSubscriberType } from '../../../models/mqSubscriberTypes';
import { BookingsSubject } from '../bookings.subject';

export class BookingsSubjectMock extends BookingsSubject {
	public static notifyMock = jest.fn();
	public get booking(): Booking {
		return {
			_status: BookingStatus.Accepted,
			status: BookingStatus.Accepted,
			_service: {
				_name: 'name',
				_mqSubscriber: [MqSubscriberType.LifeSG],
			},
			service: {
				name: 'name',
				mqSubscriber: [MqSubscriberType.LifeSG],
			},
			_serviceProvider: {
				_name: 'name',
			},
			videoConferenceUrl: 'https://www.google.com',
			_videoConferenceUrl: 'https://www.google.com',
			_citizenEmail: 'email',
			_location: 'location',
			_startDateTime: new Date(),
			_endDateTime: new Date(),
		} as unknown as Booking;
	}

	public notify(...params): void {
		return BookingsSubjectMock.notifyMock(...params);
	}
}

export class PendingApprovalBookingSubjectMock extends BookingsSubjectMock {
	public get booking(): Booking {
		return {
			_status: BookingStatus.PendingApproval,
			status: BookingStatus.PendingApproval,
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
		} as unknown as Booking;
	}
}

export class OnHoldBookingSubjectMock extends BookingsSubjectMock {
	public get booking(): Booking {
		return {
			_status: BookingStatus.OnHold,
			status: BookingStatus.OnHold,
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
		} as unknown as Booking;
	}
}
