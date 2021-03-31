import {CitizenBookingCreated} from './emailTemplate.factory'
import {BookingsService} from "../../bookings";
import {Booking} from "../../../models/entities";
import {IPagedEntities} from "../../../core/pagedEntities";
import {BookingRequest} from "../../bookings/bookings.apicontract";

jest.mock('./emailTemplate.factory');

describe('Email template tests', () => {
    it('should create citizen email for booking created', function () {

    });

    it('should create service provider email for booking created', function () {

    });

    it('should create service provider email for booking updated', function () {

    });

    it('should create service provider email for booking cancelled', function () {

    });
});

class CitizenBookingCreatedMock {
    public static CitizenBookingCreatedEmailMock = Promise.resolve();

    public async
}

class ServiceProviderBookingCreated {
    public static ServiceProviderBookingCreatedEmail = Promise.resolve();
}

class ServiceProviderBookingUpdated {
    public static ServiceProviderBookingUpdatedEmail = Promise.resolve();
}

class ServiceProviderBookingCancelled {
    public static ServiceProviderBookingCancelled = Promise.resolve();
}

class BookingsServiceMock implements Partial<BookingsService> {
    public static mockBooking: Booking;
    public static mockAcceptBooking = Promise.resolve(BookingsServiceMock.mockBooking);
    public static mockCancelBooking = Promise.resolve(BookingsServiceMock.mockBooking);
    public static mockRejectBooking = Promise.resolve(BookingsServiceMock.mockBooking);
    public static mockGetBooking: Booking;
    public static mockPostBooking = Promise.resolve(BookingsServiceMock.mockBooking);
    public static mockBookings: Booking[] = [];
    public static searchBookings = jest.fn<Promise<IPagedEntities<Booking>>, any>();
    public static mockBookingId;
    public static getBookingPromise = Promise.resolve(BookingsServiceMock.mockGetBooking);
    public static mockUpdateBooking: Booking;
    public static mockValidateOnHoldBooking = Promise.resolve(BookingsServiceMock.mockBooking);

    public async getBooking(bookingId: number): Promise<Booking> {
        BookingsServiceMock.mockBookingId = bookingId;
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

    public async save(bookingRequest: BookingRequest): Promise<Booking> {
        return BookingsServiceMock.mockPostBooking;
    }

    public async update(bookingId: number, bookingRequest: BookingRequest): Promise<Booking> {
        BookingsServiceMock.mockBookingId = bookingId;
        return BookingsServiceMock.mockUpdateBooking;
    }

    public async validateOnHoldBooking(bookingId: number, bookingRequest: BookingRequest): Promise<Booking> {
        BookingsServiceMock.mockBookingId = bookingId;
        return BookingsServiceMock.mockValidateOnHoldBooking;
    }
}
