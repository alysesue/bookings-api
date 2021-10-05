import { Booking } from '../../../models';
import { BookingsMapper } from '../bookings.mapper';

export class BookingsMapperMock implements Partial<BookingsMapper> {
	public static mapEventsDataModel = jest.fn<Promise<Booking>, any>();

	public async mapEventsDataModel(...params): Promise<any> {
		return await BookingsMapperMock.mapEventsDataModel(...params);
	}
}
