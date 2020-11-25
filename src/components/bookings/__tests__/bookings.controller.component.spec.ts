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

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

jest.mock('mol-lib-common', () => {
	const actual = jest.requireActual('mol-lib-common');
	const mock = () => {
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

const createTimeslot = (startTime: Date, endTime: Date, capacity?: number) => {
	return { startTime, endTime, capacity: capacity || 1 } as TimeslotWithCapacity;
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

		return Array.from(timeslotEntry.getTimeslotServiceProviders(true));
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
