import { Container } from 'typescript-ioc';
import { BookingsController } from '../index';
import { BookingsRepository } from '../bookings.repository';
import { Booking, BookingStatus, Calendar, Service, ServiceProvider, User } from '../../../models';
import { CalendarsRepository } from '../../calendars/calendars.repository';
import { GoogleApi } from '../../../googleapi/google.api';
// @ts-ignore
import * as insertEventResponse from './createEventResponse.json';
// @ts-ignore
import * as freebusyResponse from './freebusyResponse.json';
import { BookingAcceptRequest } from '../bookings.apicontract';
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { AvailableTimeslotProviders } from '../../timeslots/availableTimeslotProviders';
import { ServiceProvidersRepository } from '../../serviceProviders/serviceProviders.repository';
import { ServicesService } from '../../services/services.service';
import { UserContext } from '../../../infrastructure/auth/userContext';
import {
	BookingActionFunction,
	BookingChangeLogsService,
	GetBookingFunction,
} from '../../../components/bookingChangeLogs/bookingChangeLogs.service';
import { BookingBuilder } from '../../../models/entities/booking';
import { AuthGroup, ServiceAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { TimeslotWithCapacity } from '../../../models/timeslotWithCapacity';
import { TimeslotServiceProviderResult } from '../../../models/timeslotServiceProvider';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

jest.mock('mol-lib-common', () => {
	const actual = jest.requireActual('mol-lib-common');
	const mock = (config: any) => {
		return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => descriptor;
	};
	return {
		...actual,
		MOLAuth: mock,
	};
});

beforeEach(() => {
	TimeslotsServiceMock.availableProvidersForTimeslot = new Map<ServiceProvider, TimeslotWithCapacity>();
});

describe('Booking Integration tests', () => {
	it('should accept booking', async () => {
		const calendar = new Calendar();
		calendar.id = 1;
		calendar.uuid = '123';
		calendar.googleCalendarId = 'google-id-1';

		const service = new Service();
		service.id = 2;
		const provider = ServiceProvider.create('Provider', 2);
		provider.id = 11;
		provider.calendar = calendar;
		const timeslotWithCapacity = new TimeslotWithCapacity(
			new Date('2020-10-01T01:00:00'),
			new Date('2020-10-01T02:00:00'),
		);

		const adminMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
		});

		Container.bind(BookingsRepository).to(BookingRepositoryMock);
		Container.bind(CalendarsRepository).to(CalendarsRepositoryMock());
		Container.bind(TimeslotsService).to(TimeslotsServiceMock);
		Container.bind(GoogleApi).to(GoogleApiMock());
		Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(BookingChangeLogsService).to(BookingChangeLogsServiceMock);
		Container.bind(ServicesService).to(ServicesServiceMock);

		ServiceProvidersRepositoryMock.getServiceProviderMock = provider;
		TimeslotsServiceMock.availableProvidersForTimeslot = new Map<ServiceProvider, TimeslotWithCapacity>();
		TimeslotsServiceMock.availableProvidersForTimeslot.set(provider, timeslotWithCapacity);
		TimeslotsServiceMock.isProviderAvailableForTimeslot.mockReturnValue(Promise.resolve(true));

		const bookingMock = new BookingBuilder()
			.withServiceId(2)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();

		BookingRepositoryMock.getBooking.mockImplementation(() => Promise.resolve(bookingMock));
		BookingRepositoryMock.update.mockImplementation((b) => Promise.resolve(b));

		BookingChangeLogsServiceMock.executeAndLogAction.mockImplementation(
			async (
				bookingId: number,
				getBookingFunction: GetBookingFunction,
				actionFunction: BookingActionFunction,
			) => {
				const _booking = await getBookingFunction(bookingId);
				const [, newBooking] = await actionFunction(_booking);
				return newBooking;
			},
		);
		ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(service));
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);

		const controller = Container.get(BookingsController);

		await controller.acceptBooking(1, { serviceProviderId: 11 } as BookingAcceptRequest);

		expect(BookingRepositoryMock.update).toBeCalledTimes(1);
		const booking = BookingRepositoryMock.update.mock.calls[0][0] as Booking;

		expect(booking.status).toBe(BookingStatus.Accepted);
		expect(booking.eventICalId).toBe('s1ov9v4ic15vcs30dtfgeoclg8@google.com');
	});
});

class BookingRepositoryMock extends BookingsRepository {
	public static getBooking = jest.fn();
	public static update = jest.fn();

	public async getBooking(...params): Promise<Booking> {
		return await BookingRepositoryMock.getBooking(...params);
	}

	public async update(...params): Promise<Booking> {
		return await BookingRepositoryMock.update(...params);
	}
}

const CalendarsRepositoryMock = () => {
	const calendar = new Calendar();
	calendar.googleCalendarId = 'google-id-1';
	return jest.fn().mockImplementation(() => ({
		getCalendarByUUID: jest.fn().mockReturnValue(calendar),
	}));
};

const GoogleApiMock = () => {
	return jest.fn().mockImplementation(() => ({
		getCalendarApi: jest.fn().mockReturnValue({
			freebusy: {
				query: jest.fn().mockReturnValue(freebusyResponse),
			},
			events: {
				insert: jest.fn().mockReturnValue(insertEventResponse),
			},
			calendars: jest.fn(),
		}),
	}));
};

class TimeslotsServiceMock extends TimeslotsService {
	public static availableProvidersForTimeslot = new Map<ServiceProvider, TimeslotWithCapacity>();
	public static isProviderAvailableForTimeslot = jest.fn<Promise<boolean>, any>();

	public async getAvailableProvidersForTimeslot(
		startDateTime: Date,
		endDateTime: Date,
		serviceId: number,
	): Promise<TimeslotServiceProviderResult[]> {
		const timeslotEntry = new AvailableTimeslotProviders();
		timeslotEntry.startTime = startDateTime;
		timeslotEntry.endTime = startDateTime;
		timeslotEntry.setRelatedServiceProviders(TimeslotsServiceMock.availableProvidersForTimeslot);

		return Array.from(timeslotEntry.getTimeslotServiceProviders());
	}

	public async isProviderAvailableForTimeslot(...params): Promise<any> {
		return await TimeslotsServiceMock.isProviderAvailableForTimeslot(...params);
	}
}

class ServiceProvidersRepositoryMock extends ServiceProvidersRepository {
	public static getServiceProviderMock: ServiceProvider;

	public async getServiceProvider(): Promise<ServiceProvider> {
		return Promise.resolve(ServiceProvidersRepositoryMock.getServiceProviderMock);
	}
}

class UserContextMock extends UserContext {
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

class BookingChangeLogsServiceMock extends BookingChangeLogsService {
	public static executeAndLogAction = jest.fn();

	public async executeAndLogAction(...params): Promise<any> {
		return await BookingChangeLogsServiceMock.executeAndLogAction(...params);
	}
}

class ServicesServiceMock extends ServicesService {
	public static getService = jest.fn();

	public init() {}
	public async getService(...params): Promise<any> {
		return await ServicesServiceMock.getService(params);
	}
}
