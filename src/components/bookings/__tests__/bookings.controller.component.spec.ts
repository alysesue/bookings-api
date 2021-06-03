import { Container } from 'typescript-ioc';
import { BookingsController } from '../index';
import { BookingsRepository } from '../bookings.repository';
import { Booking, BookingStatus, Service, ServiceProvider, User } from '../../../models';
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
} from '../../bookingChangeLogs/bookingChangeLogs.service';
import { BookingBuilder } from '../../../models/entities/booking';
import { AuthGroup, ServiceAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { TimeslotWithCapacity } from '../../../models/timeslotWithCapacity';
import { TimeslotServiceProviderResult } from '../../../models/timeslotServiceProvider';
import { BookingsSubject } from '../bookings.subject';
import { BookingsSubjectMock } from '../__mocks__/bookings.subject.mock';
import { MailObserver } from '../../notifications/notification.observer';
import { MockObserver } from '../../../infrastructure/__mocks__/observer.mock';
import { LifeSGObserver } from '../../lifesg/lifesg.observer';
import { getConfig } from '../../../config/app-config';
import { ServiceProvidersLookup } from '../../../components/timeslots/aggregatorTimeslotProviders';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

jest.mock('../../../config/app-config', () => ({
	getConfig: jest.fn(),
}));

beforeEach(() => {
	TimeslotsServiceMock.availableProvidersForTimeslot = new Map<ServiceProvider, TimeslotWithCapacity>();
});

const createTimeslot = (startTime: Date, endTime: Date, capacity?: number) => {
	return {
		startTimeNative: startTime.getTime(),
		endTimeNative: endTime.getTime(),
		capacity: capacity || 1,
	} as TimeslotWithCapacity;
};

describe('Booking Integration tests', () => {
	it('should accept booking', async () => {
		const service = new Service();
		service.id = 2;
		const provider = ServiceProvider.create('Provider', 2);
		provider.id = 11;
		const timeslotWithCapacity = createTimeslot(new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00'));

		const adminMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
		});

		Container.bind(BookingsRepository).to(BookingRepositoryMock);
		Container.bind(TimeslotsService).to(TimeslotsServiceMock);
		Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(BookingChangeLogsService).to(BookingChangeLogsServiceMock);
		Container.bind(ServicesService).to(ServicesServiceMock);
		Container.bind(BookingsSubject).to(BookingsSubjectMock);
		Container.bind(MailObserver).to(MockObserver);
		Container.bind(LifeSGObserver).to(MockObserver);
		(getConfig as jest.Mock).mockReturnValue({
			featureFlag: {
				lifeSGSync: 'true',
			},
		});

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
				const _booking = await getBookingFunction(bookingId, {});
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
	});
});

class BookingRepositoryMock implements Partial<BookingsRepository> {
	public static getBooking = jest.fn();
	public static update = jest.fn();

	public async getBooking(...params): Promise<Booking> {
		return await BookingRepositoryMock.getBooking(...params);
	}

	public async update(...params): Promise<Booking> {
		return await BookingRepositoryMock.update(...params);
	}
}

class TimeslotsServiceMock implements Partial<TimeslotsService> {
	public static availableProvidersForTimeslot = new Map<ServiceProvider, TimeslotWithCapacity>();
	public static isProviderAvailableForTimeslot = jest.fn<Promise<boolean>, any>();

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

class ServiceProvidersRepositoryMock implements Partial<ServiceProvidersRepository> {
	public static getServiceProviderMock: ServiceProvider;

	public async getServiceProvider(): Promise<ServiceProvider> {
		return Promise.resolve(ServiceProvidersRepositoryMock.getServiceProviderMock);
	}
}

class UserContextMock implements Partial<UserContext> {
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

class BookingChangeLogsServiceMock implements Partial<BookingChangeLogsService> {
	public static executeAndLogAction = jest.fn();

	public async executeAndLogAction(...params): Promise<any> {
		return await BookingChangeLogsServiceMock.executeAndLogAction(...params);
	}
}

class ServicesServiceMock implements Partial<ServicesService> {
	public static getService = jest.fn();

	public init() {}
	public async getService(...params): Promise<any> {
		return await ServicesServiceMock.getService(...params);
	}
}
