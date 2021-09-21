import { BookingsService } from '../bookings.service';
import { Booking } from '../../../models/entities';
import { IPagedEntities } from '../../../core/pagedEntities';
import { BookingRequestV1 } from '../bookings.apicontract';

export class BookingsServiceMock implements Partial<BookingsService> {
	public static getBooking = jest.fn<Promise<Booking>, any>();
	public static searchBookings = jest.fn<Promise<IPagedEntities<Booking>>, any>();
	public static mockSearchBookingsReturnAll = jest.fn<Promise<Booking[]>, any>();
	public static mockCheckLimit = jest.fn<Promise<void>, any>();
	public static changeUser = jest.fn<Promise<Booking>, any>();
	public static bookAnEventMock = jest.fn<Promise<Booking>, any>();

	public static mockBooking: Booking;
	public static mockAcceptBooking = Promise.resolve(BookingsServiceMock.mockBooking);
	public static mockCancelBooking = Promise.resolve(BookingsServiceMock.mockBooking);
	public static mockRejectBooking = Promise.resolve(BookingsServiceMock.mockBooking);
	public static mockPostBooking = Promise.resolve(BookingsServiceMock.mockBooking);
	public static mockBookings: Booking[] = [];
	public static mockBookingId;
	public static mockBookingUUID;
	public static getBookingPromise = Promise.resolve(BookingsServiceMock.mockBooking);
	public static getBookingByUUIDPromise = Promise.resolve(BookingsServiceMock.mockBooking);
	public static mockUpdateBooking: Booking;
	public static mockValidateOnHoldBooking = Promise.resolve(BookingsServiceMock.mockBooking);

	public async getBooking(...params): Promise<any> {
		return await BookingsServiceMock.getBooking(...params);
	}

	public async getBookingByUUID(bookingUUID: string): Promise<Booking> {
		BookingsServiceMock.mockBookingUUID = bookingUUID;
		return BookingsServiceMock.getBookingPromise;
	}

	public async acceptBooking(bookingId: number): Promise<Booking> {
		BookingsServiceMock.mockBookingId = bookingId;
		return BookingsServiceMock.mockAcceptBooking;
	}

	public async cancelBooking(bookingId: number): Promise<Booking> {
		BookingsServiceMock.mockBookingId = bookingId;
		return BookingsServiceMock.mockCancelBooking;
	}
	public async rejectBooking(bookingId: number): Promise<Booking> {
		BookingsServiceMock.mockBookingId = bookingId;
		return BookingsServiceMock.mockRejectBooking;
	}

	public async searchBookings(...params): Promise<any> {
		return await BookingsServiceMock.searchBookings(...params);
	}

	public async searchBookingsReturnAll(...params): Promise<any> {
		return await BookingsServiceMock.mockSearchBookingsReturnAll(...params);
	}

	public async checkLimit(...params): Promise<void> {
		return BookingsServiceMock.mockCheckLimit(...params);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async save(bookingRequest: BookingRequestV1): Promise<Booking> {
		return BookingsServiceMock.mockPostBooking;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async update(bookingId: number, bookingRequest: BookingRequestV1): Promise<Booking> {
		BookingsServiceMock.mockBookingId = bookingId;
		return BookingsServiceMock.mockUpdateBooking;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async validateOnHoldBooking(bookingId: number, bookingRequest: BookingRequestV1): Promise<Booking> {
		BookingsServiceMock.mockBookingId = bookingId;
		return BookingsServiceMock.mockValidateOnHoldBooking;
	}

	public async changeUser(...params): Promise<Booking> {
		return await BookingsServiceMock.changeUser(...params);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async bookAnEvent(...params): Promise<Booking> {
		return BookingsServiceMock.bookAnEventMock(...params);
	}
}
