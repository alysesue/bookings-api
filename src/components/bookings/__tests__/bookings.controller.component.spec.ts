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
import { UserContext } from '../../../infrastructure/userContext.middleware';
import { BookingChangeLogsService } from '../../../components/bookingChangeLogs/bookingChangeLogs.service';
import { BookingActionFunction } from '../../../components/bookingChangeLogs/bookingChangeLogs.service';

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

const BookingRepositoryMock = (update) => {
	const testBooking = Booking.create(1, new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00'));
	return jest.fn().mockImplementation(() => ({
		getBooking: jest.fn().mockReturnValue(testBooking),
		update,
	}));
};

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
	public static availableProvidersForTimeslot: ServiceProvider[] = [];

	public async getAvailableProvidersForTimeslot(
		startDateTime: Date,
		endDateTime: Date,
		serviceId: number,
	): Promise<AvailableTimeslotProviders> {
		const timeslotEntry = new AvailableTimeslotProviders();
		timeslotEntry.startTime = startDateTime;
		timeslotEntry.endTime = startDateTime;
		timeslotEntry.setRelatedServiceProviders(TimeslotsServiceMock.availableProvidersForTimeslot);

		return timeslotEntry;
	}
}

class ServiceProvidersRepositoryMock extends ServiceProvidersRepository {
	public static getServiceProviderMock: ServiceProvider;

	public async getServiceProvider(): Promise<ServiceProvider> {
		return Promise.resolve(ServiceProvidersRepositoryMock.getServiceProviderMock);
	}
}

describe('Booking Integration tests', () => {
	it('should accept booking', async () => {
		const updateBooking = jest.fn();
		const calendar = new Calendar();
		calendar.id = 1;
		calendar.uuid = '123';
		calendar.googleCalendarId = 'google-id-1';

		const service = new Service();
		service.id = 2;
		const provider = ServiceProvider.create('Provider', calendar, 2);
		provider.id = 11;

		const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');

		Container.bind(BookingsRepository).to(BookingRepositoryMock(updateBooking));
		Container.bind(CalendarsRepository).to(CalendarsRepositoryMock());
		Container.bind(TimeslotsService).to(TimeslotsServiceMock);
		Container.bind(GoogleApi).to(GoogleApiMock());
		Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(BookingChangeLogsService).to(BookingChangeLogsServiceMock);
		Container.bind(ServicesService).to(ServicesServiceMock);

		ServiceProvidersRepositoryMock.getServiceProviderMock = provider;
		TimeslotsServiceMock.availableProvidersForTimeslot = [provider];
		BookingChangeLogsServiceMock.executeAndLogAction.mockImplementation(
			async (_booking: Booking, asyncFunction: BookingActionFunction) => {
				const [, newBooking] = await asyncFunction(_booking);
				return newBooking;
			},
		);
		ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(service));
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		const controller = Container.get(BookingsController);

		await controller.acceptBooking(1, { serviceProviderId: 11 } as BookingAcceptRequest);

		expect(updateBooking).toBeCalledTimes(1);
		const booking = updateBooking.mock.calls[0][0] as Booking;

		expect(booking.status).toBe(BookingStatus.Accepted);
		expect(booking.eventICalId).toBe('s1ov9v4ic15vcs30dtfgeoclg8@google.com');
	});
});

class UserContextMock extends UserContext {
	public static getCurrentUser = jest.fn();

	public init() {}
	public async getCurrentUser(...params): Promise<any> {
		return await UserContextMock.getCurrentUser(params);
	}
}

class BookingChangeLogsServiceMock extends BookingChangeLogsService {
	public static executeAndLogAction = jest.fn();

	public async executeAndLogAction(booking: Booking, actionFunction: BookingActionFunction): Promise<any> {
		return await BookingChangeLogsServiceMock.executeAndLogAction(booking, actionFunction);
	}
}

class ServicesServiceMock extends ServicesService {
	public static getService = jest.fn();

	public init() {}
	public async getService(...params): Promise<any> {
		return await ServicesServiceMock.getService(params);
	}
}
