import { BookingsRepository } from '../bookings.repository';
import { Booking, BookingUUIDInfo, ChangeLogAction } from '../../../models';
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { AvailableTimeslotProviders } from '../../timeslots/availableTimeslotProviders';
import { UnavailabilitiesService } from '../../unavailabilities/unavailabilities.service';
import { BookingChangeLogsService } from '../../bookingChangeLogs/bookingChangeLogs.service';
import { TimeslotServiceProviderResult } from '../../../models/timeslotServiceProvider';
import { IPagedEntities } from '../../../core/pagedEntities';
import { BookingsNoAuthRepository } from '../bookings.noauth.repository';

export class BookingRepositoryMock implements Partial<BookingsRepository> {
	public static booking: Booking;
	public static searchBookings = jest.fn<Promise<IPagedEntities<Booking>>, any>();
	public static searchReturnAll = jest.fn<Promise<Booking[]>, any>();
	public static saveMock: Promise<Booking>;
	public static getBookingByUUID = jest.fn<Promise<Booking>, any>();
	public static update = jest.fn<Promise<Booking>, [Booking]>();
	public static getBookingsByEventId = jest.fn<Promise<Booking[]>, any>();
	public static saveMultiple = jest.fn<Promise<Booking[]>, any>();

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async getBooking(id: number): Promise<Booking> {
		return Promise.resolve(BookingRepositoryMock.booking);
	}

	public async insert(booking: Booking): Promise<Booking> {
		if (BookingRepositoryMock.saveMock) {
			return BookingRepositoryMock.saveMock;
		}
		BookingRepositoryMock.booking = booking;
		return Promise.resolve({
			identifiers: [
				{
					_id: 1,
				},
			],
		} as unknown as Booking);
	}

	public async update(booking: Booking): Promise<Booking> {
		return await BookingRepositoryMock.update(booking);
	}

	public async search(...params): Promise<any> {
		return await BookingRepositoryMock.searchBookings(...params);
	}

	public async searchReturnAll(...params): Promise<Booking[]> {
		return await BookingRepositoryMock.searchReturnAll(...params);
	}

	public async getBookingByUUID(...params): Promise<Booking> {
		return await BookingRepositoryMock.getBookingByUUID(...params);
	}

	public async getBookingsByEventId(...params): Promise<Booking[]> {
		return await BookingRepositoryMock.getBookingsByEventId(...params);
	}

	public async saveMultiple(...params): Promise<Booking[]> {
		return await BookingRepositoryMock.saveMultiple(...params)
	}
}

export class BookingsNoAuthRepositoryMock implements Partial<BookingsNoAuthRepository> {
	public static getBookingInfoByUUID = jest.fn<Promise<BookingUUIDInfo>, any>();

	public async getBookingInfoByUUID(...params): Promise<BookingUUIDInfo> {
		return await BookingsNoAuthRepositoryMock.getBookingInfoByUUID(...params);
	}
}

export class TimeslotsServiceMock implements Partial<TimeslotsService> {
	public static getAvailableProvidersForTimeslot = jest.fn<Promise<TimeslotServiceProviderResult[]>, any>();
	public static isProviderAvailableForTimeslot = jest.fn<Promise<boolean>, any>();
	public static getAggregatedTimeslots = jest.fn();

	public async getAggregatedTimeslots(...params): Promise<AvailableTimeslotProviders[]> {
		return Promise.resolve(TimeslotsServiceMock.getAggregatedTimeslots(...params));
	}

	public async getAvailableProvidersForTimeslot(...params): Promise<any> {
		return await TimeslotsServiceMock.getAvailableProvidersForTimeslot(...params);
	}

	public async isProviderAvailableForTimeslot(...params): Promise<any> {
		return await TimeslotsServiceMock.isProviderAvailableForTimeslot(...params);
	}
}

export class UnavailabilitiesServiceMock implements Partial<UnavailabilitiesService> {
	public static isUnavailable = jest.fn();

	public async isUnavailable(...params): Promise<any> {
		return await UnavailabilitiesServiceMock.isUnavailable(...params);
	}
}

export class BookingChangeLogsServiceMock implements Partial<BookingChangeLogsService> {
	public static executeAndLogAction = jest.fn();
	public static executeAndLogMultipleActions = jest.fn();
	public static action: ChangeLogAction;

	public async executeAndLogAction(...params): Promise<any> {
		return await BookingChangeLogsServiceMock.executeAndLogAction(...params);
	}

	public async executeAndLogMultipleActions(...params): Promise<any> {
		return await BookingChangeLogsServiceMock.executeAndLogMultipleActions(...params);
	}
}
