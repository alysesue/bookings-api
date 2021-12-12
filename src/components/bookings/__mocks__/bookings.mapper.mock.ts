import { Booking } from '../../../models';
import { BookingAuthType } from '../bookings.apicontract';
import { BookingsMapper } from '../bookings.mapper';

export class BookingsMapperMock implements Partial<BookingsMapper> {
	public static mapEventsDataModel = jest.fn<Promise<Booking>, any>();
	public static mapBookingAuthType = jest.fn<BookingAuthType, any>();

	public async mapEventsDataModel(...params): Promise<any> {
		return await BookingsMapperMock.mapEventsDataModel(...params);
	}

	public mapBookingAuthType(...params): BookingAuthType {
		return BookingsMapperMock.mapBookingAuthType(...params);
	}
}
