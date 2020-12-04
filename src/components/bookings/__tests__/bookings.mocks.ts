import { BookingsRepository } from '../bookings.repository';
import { Booking, ChangeLogAction, ServiceProvider, User } from '../../../models';
import { InsertResult } from 'typeorm';
import { BookingSearchRequest } from '../bookings.apicontract';
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { AvailableTimeslotProviders } from '../../timeslots/availableTimeslotProviders';
import { ServiceProvidersRepository } from '../../serviceProviders/serviceProviders.repository';
import { UnavailabilitiesService } from '../../unavailabilities/unavailabilities.service';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { BookingChangeLogsService } from '../../bookingChangeLogs/bookingChangeLogs.service';
import { ServicesService } from '../../services/services.service';
import { AuthGroup } from '../../../infrastructure/auth/authGroup';
import { ServiceProvidersService } from '../../../components/serviceProviders/serviceProviders.service';
import { TimeslotWithCapacity } from '../../../models/timeslotWithCapacity';
import { TimeslotServiceProviderResult } from '../../../models/timeslotServiceProvider';
import { CaptchaService } from '../../captcha/captcha.service';

export class BookingRepositoryMock extends BookingsRepository {
	public static booking: Booking;
	public static searchBookingsMock: Booking[];
	public static saveMock: Promise<InsertResult>;

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

	public async search(searchRequest: BookingSearchRequest): Promise<Booking[]> {
		return Promise.resolve(BookingRepositoryMock.searchBookingsMock);
	}
}

export class TimeslotsServiceMock extends TimeslotsService {
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
		serviceId: number,
	): Promise<TimeslotServiceProviderResult[]> {
		const timeslotEntry = new AvailableTimeslotProviders();
		timeslotEntry.startTime = startDateTime;
		timeslotEntry.endTime = startDateTime;
		timeslotEntry.setRelatedServiceProviders(TimeslotsServiceMock.availableProvidersForTimeslot);

		return Array.from(timeslotEntry.getTimeslotServiceProviders(true));
	}

	public async isProviderAvailableForTimeslot(...params): Promise<any> {
		return await TimeslotsServiceMock.isProviderAvailableForTimeslot(...params);
	}
}

export class ServiceProvidersRepositoryMock extends ServiceProvidersRepository {
	public static getServiceProviderMock: ServiceProvider;

	public async getServiceProvider(): Promise<ServiceProvider> {
		return Promise.resolve(ServiceProvidersRepositoryMock.getServiceProviderMock);
	}
}

export class ServiceProvidersServiceMock extends ServiceProvidersService {
	public static getServiceProvider = jest.fn<Promise<ServiceProvider>, any>();

	public async getServiceProvider(...params): Promise<any> {
		return await ServiceProvidersServiceMock.getServiceProvider(...params);
	}
}

export class UnavailabilitiesServiceMock extends UnavailabilitiesService {
	public static isUnavailable = jest.fn();

	public async isUnavailable(...params): Promise<any> {
		return await UnavailabilitiesServiceMock.isUnavailable(...params);
	}
}

export class UserContextMock extends UserContext {
	public static getCurrentUser = jest.fn<Promise<User>, any>();
	public static getAuthGroups = jest.fn<Promise<AuthGroup[]>, any>();

	public init() {}
	public async getCurrentUser(...params): Promise<any> {
		return await UserContextMock.getCurrentUser(...params);
	}

	public async getAuthGroups(...params): Promise<any> {
		return await UserContextMock.getAuthGroups(...params);
	}
}

export class BookingChangeLogsServiceMock extends BookingChangeLogsService {
	public static executeAndLogAction = jest.fn();
	public static action: ChangeLogAction;

	public async executeAndLogAction(...params): Promise<any> {
		return await BookingChangeLogsServiceMock.executeAndLogAction(...params);
	}
}

export class ServicesServiceMock extends ServicesService {
	public static getService = jest.fn();

	public init() {}

	public async getService(...params): Promise<any> {
		return await ServicesServiceMock.getService(params);
	}
}
