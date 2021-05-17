import { BookingsRepository } from '../bookings.repository';
import { Booking, ChangeLogAction, ServiceProvider, User } from '../../../models';
import { InsertResult } from 'typeorm';
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { AvailableTimeslotProviders } from '../../timeslots/availableTimeslotProviders';
import { ServiceProvidersRepository } from '../../serviceProviders/serviceProviders.repository';
import { UnavailabilitiesService } from '../../unavailabilities/unavailabilities.service';
import { BookingChangeLogsService } from '../../bookingChangeLogs/bookingChangeLogs.service';
import { TimeslotWithCapacity } from '../../../models/timeslotWithCapacity';
import { TimeslotServiceProviderResult } from '../../../models/timeslotServiceProvider';
import { UsersService } from '../../users/users.service';
import { IPagedEntities } from '../../../core/pagedEntities';
import { ServiceProvidersLookup } from '../../../components/timeslots/aggregatorTimeslotProviders';

export class BookingRepositoryMock implements Partial<BookingsRepository> {
	public static booking: Booking;
	public static searchBookings = jest.fn<Promise<IPagedEntities<Booking>>, any>();
	public static searchReturnAll = jest.fn<Promise<Booking[]>, any>();
	public static saveMock: Promise<InsertResult>;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async getBooking(id: number): Promise<Booking> {
		return Promise.resolve(BookingRepositoryMock.booking);
	}

	public async insert(booking: Booking): Promise<InsertResult> {
		if (BookingRepositoryMock.saveMock) {
			return BookingRepositoryMock.saveMock;
		}
		BookingRepositoryMock.booking = booking;
		return Promise.resolve(new InsertResult());
	}

	public async update(booking: Booking): Promise<Booking> {
		return Promise.resolve(booking);
	}

	public async search(...params): Promise<any> {
		return await BookingRepositoryMock.searchBookings(...params);
	}

	public async searchReturnAll(...params): Promise<Booking[]> {
		return await BookingRepositoryMock.searchReturnAll(...params);
	}
}

export class TimeslotsServiceMock implements Partial<TimeslotsService> {
	public static availableProvidersForTimeslot = new Map<ServiceProvider, TimeslotWithCapacity>();
	public static acceptedBookings: Booking[] = [];
	public static isProviderAvailableForTimeslot = jest.fn<Promise<boolean>, any>();
	public static getAggregatedTimeslots = jest.fn();

	public async getAggregatedTimeslots(...params): Promise<AvailableTimeslotProviders[]> {
		return Promise.resolve(TimeslotsServiceMock.getAggregatedTimeslots(...params));
	}

	public async getAvailableProvidersForTimeslot(
		startDateTime: Date,
		endDateTime: Date,
	): Promise<TimeslotServiceProviderResult[]> {
		const timeslotEntry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
		timeslotEntry.startTime = startDateTime.getTime();
		timeslotEntry.endTime = endDateTime.getTime();
		for (const [sp, timeslot] of TimeslotsServiceMock.availableProvidersForTimeslot) {
			timeslotEntry.addServiceProvider(sp, timeslot);
		}

		return Array.from(timeslotEntry.getTimeslotServiceProviders(true));
	}

	public async isProviderAvailableForTimeslot(...params): Promise<any> {
		return await TimeslotsServiceMock.isProviderAvailableForTimeslot(...params);
	}
}

export class ServiceProvidersRepositoryMock implements Partial<ServiceProvidersRepository> {
	public static getServiceProviderMock: ServiceProvider;

	public async getServiceProvider(): Promise<ServiceProvider> {
		return Promise.resolve(ServiceProvidersRepositoryMock.getServiceProviderMock);
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
	public static action: ChangeLogAction;

	public async executeAndLogAction(...params): Promise<any> {
		return await BookingChangeLogsServiceMock.executeAndLogAction(...params);
	}
}

export class UsersServiceMock implements Partial<UsersService> {
	public static persistUserIfRequired = jest.fn();

	public async persistUserIfRequired(...params): Promise<User> {
		return await UsersServiceMock.persistUserIfRequired(...params);
	}
}
