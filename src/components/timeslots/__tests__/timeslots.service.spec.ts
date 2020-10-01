import { Container } from 'typescript-ioc';
import {
	Booking,
	BookingStatus,
	Calendar,
	Service,
	ServiceProvider,
	Timeslot,
	TimeslotsSchedule,
	Unavailability,
} from '../../../models';
import { TimeslotsService } from '../timeslots.service';
import { BookingsRepository } from '../../bookings/bookings.repository';
import { DateHelper } from '../../../infrastructure/dateHelper';
import { ServicesRepository } from '../../services/services.repository';
import { ServiceProvidersRepository } from '../../serviceProviders/serviceProviders.repository';
import { AvailableTimeslotProviders } from '../availableTimeslotProviders';
import { UnavailabilitiesService } from '../../unavailabilities/unavailabilities.service';
import { BookingBuilder } from '../../../models/entities/booking';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('Timeslots Service', () => {
	const date = new Date(2020, 4, 27);
	const endDate = DateHelper.setHours(date, 11, 59);
	const timeslot = new Timeslot(DateHelper.setHours(date, 15, 0), DateHelper.setHours(date, 16, 0));
	const timeslot2 = new Timeslot(DateHelper.setHours(date, 16, 0), DateHelper.setHours(date, 17, 0));
	const timeslot3 = new Timeslot(DateHelper.setHours(date, 17, 0), DateHelper.setHours(date, 18, 0));
	const timeslot4 = new Timeslot(DateHelper.setHours(date, 18, 30), DateHelper.setHours(date, 19, 30));

	const TimeslotsScheduleMock = {
		_id: 1,
		generateValidTimeslots: jest.fn(),
	};

	const ProviderScheduleMock = {
		_id: 2,
		generateValidTimeslots: jest.fn(),
	};

	const CalendarMock = new Calendar();
	CalendarMock.id = 1;

	const ServiceMock = new Service();
	ServiceMock.id = 1;
	ServiceMock.timeslotsSchedule = (TimeslotsScheduleMock as unknown) as TimeslotsSchedule;
	ServiceMock.timeslotsScheduleId = TimeslotsScheduleMock._id;

	const ServiceProviderMock = ServiceProvider.create('Provider', CalendarMock, ServiceMock.id);
	ServiceProviderMock.id = 100;

	const ServiceProviderMock2 = ServiceProvider.create('Provider with schedule', CalendarMock, ServiceMock.id);
	ServiceProviderMock2.id = 101;
	ServiceProviderMock2.timeslotsSchedule = (ProviderScheduleMock as unknown) as TimeslotsSchedule;
	ServiceProviderMock2.timeslotsScheduleId = ProviderScheduleMock._id;

	// Booking in place for the last time slot
	const BookingMock = new BookingBuilder()
		.withServiceId(1)
		.withStartDateTime(DateHelper.setHours(date, 17, 0))
		.withEndDateTime(DateHelper.setHours(date, 18, 0))
		.build();

	const pendingBookingMock = new BookingBuilder()
		.withServiceId(1)
		.withStartDateTime(DateHelper.setHours(date, 17, 0))
		.withEndDateTime(DateHelper.setHours(date, 18, 0))
		.build();

	BookingMock.status = BookingStatus.Accepted;
	BookingMock.eventICalId = 'eventICalId';
	BookingMock.serviceProvider = ServiceProviderMock;
	BookingMock.serviceProviderId = ServiceProviderMock.id;

	pendingBookingMock.status = BookingStatus.PendingApproval;

	const BookingsRepositoryMock = {
		search: jest.fn(),
	};

	const ServicesRepositoryMock = {
		getServiceWithTimeslotsSchedule: jest.fn(),
	};

	const ServiceProvidersRepositoryMock = {
		getServiceProviders: jest.fn(),
	};

	const unavailability1 = new Unavailability();
	unavailability1.allServiceProviders = true;
	unavailability1.start = DateHelper.setHours(date, 22, 0);
	unavailability1.end = DateHelper.setHours(date, 23, 0);

	const unavailability2 = new Unavailability();
	unavailability1.allServiceProviders = false;
	unavailability1.serviceProviders = [ServiceProviderMock];
	unavailability1.start = DateHelper.setHours(date, 19, 0);
	unavailability1.end = DateHelper.setHours(date, 20, 0);

	const UnavailabilitiesServiceMock = {
		search: jest.fn(),
	};

	beforeAll(() => {
		Container.bind(BookingsRepository).factory(() => {
			return BookingsRepositoryMock;
		});
		Container.bind(ServicesRepository).factory(() => {
			return ServicesRepositoryMock;
		});
		Container.bind(ServiceProvidersRepository).factory(() => {
			return ServiceProvidersRepositoryMock;
		});
		Container.bind(UnavailabilitiesService).factory(() => {
			return UnavailabilitiesServiceMock;
		});
	});

	beforeEach(() => {
		jest.resetAllMocks();

		BookingsRepositoryMock.search.mockImplementation(() => {
			return Promise.resolve([pendingBookingMock, BookingMock]);
		});

		ServicesRepositoryMock.getServiceWithTimeslotsSchedule.mockImplementation(() => Promise.resolve(ServiceMock));

		TimeslotsScheduleMock.generateValidTimeslots.mockImplementation(() => [
			timeslot,
			timeslot2,
			timeslot3,
			timeslot4,
		]);

		ProviderScheduleMock.generateValidTimeslots.mockImplementation(() => [timeslot3]);

		ServiceProvidersRepositoryMock.getServiceProviders.mockImplementation(() =>
			Promise.resolve([ServiceProviderMock, ServiceProviderMock2]),
		);

		UnavailabilitiesServiceMock.search.mockImplementation(() =>
			Promise.resolve([unavailability1, unavailability2]),
		);
	});

	it('should aggregate results', async () => {
		const service = Container.get(TimeslotsService);
		const result = await service.getAggregatedTimeslots(date, endDate, 1);
		expect(result.length).toBe(3);

		expect(ServicesRepositoryMock.getServiceWithTimeslotsSchedule).toBeCalled();
		expect(TimeslotsScheduleMock.generateValidTimeslots).toBeCalledTimes(1);
	});

	it('should aggregate results by service provider', async () => {
		const service = Container.get(TimeslotsService);
		const result = await service.getAggregatedTimeslots(date, endDate, 1, false, 101);
		expect(result.length).toBe(1);

		expect(ServicesRepositoryMock.getServiceWithTimeslotsSchedule).toBeCalled();
		expect(TimeslotsScheduleMock.generateValidTimeslots).toBeCalledTimes(1);
	});

	it('should get available providers', async () => {
		const service = Container.get(TimeslotsService);
		const startDateTime = DateHelper.setHours(date, 17, 0);
		const endDateTime = DateHelper.setHours(date, 18, 0);
		const result = await service.getAvailableProvidersForTimeslot(startDateTime, endDateTime, 1);

		expect(ServicesRepositoryMock.getServiceWithTimeslotsSchedule).toBeCalled();
		expect(TimeslotsScheduleMock.generateValidTimeslots).toBeCalledTimes(1);
		expect(ProviderScheduleMock.generateValidTimeslots).toBeCalledTimes(1);

		expect(result.bookedServiceProviders.size).toBe(1);
		expect(result.availableServiceProviders).toHaveLength(1);
	});

	it('should map accepted out-of-slot booking to timeslot response', async () => {
		const service = Container.get(TimeslotsService);

		const originalSetBookedServiceProviders = AvailableTimeslotProviders.prototype.setBookedServiceProviders;
		const setBookedServiceProviders = (AvailableTimeslotProviders.prototype.setBookedServiceProviders = jest.fn(
			originalSetBookedServiceProviders,
		));

		TimeslotsScheduleMock.generateValidTimeslots.mockImplementation(() => []);
		ProviderScheduleMock.generateValidTimeslots.mockImplementation(() => []);

		BookingsRepositoryMock.search.mockReturnValue(Promise.resolve([]));

		BookingsRepositoryMock.search.mockReturnValue(Promise.resolve([getOutOfSlotBooking(ServiceProviderMock)]));

		const timeslots = await service.getAggregatedTimeslots(new Date(), new Date(), 1, true);

		expect(timeslots.length).toBe(1);
		expect(setBookedServiceProviders).toHaveBeenCalled();
	});

	it('should merge bookings with same time range', async () => {
		const service = Container.get(TimeslotsService);

		const setBookedServiceProviders = (AvailableTimeslotProviders.prototype.setBookedServiceProviders = jest.fn());

		const serviceProvider1 = ServiceProvider.create('Juku', undefined, 1);
		const serviceProvider2 = ServiceProvider.create('Andi', undefined, 1);
		serviceProvider1.id = 1;
		serviceProvider2.id = 2;

		const testBooking1 = getOutOfSlotBooking(serviceProvider1);
		const testBooking2 = getOutOfSlotBooking(serviceProvider2);

		BookingsRepositoryMock.search.mockReturnValue(Promise.resolve([testBooking1, testBooking2]));

		await service.getAggregatedTimeslots(new Date(), new Date(), 1, true);

		expect(setBookedServiceProviders).toHaveBeenCalledWith([testBooking1, testBooking2]);
	});
});

const getOutOfSlotBooking = (serviceProvider: ServiceProvider): Booking => {
	const booking = new BookingBuilder()
		.withServiceId(1)
		.withStartDateTime(new Date('2020-08-08T06:00Z'))
		.withEndDateTime(new Date('2020-08-08T09:00Z'))
		.withServiceProviderId(serviceProvider.id)
		.withAutoAccept(serviceProvider.autoAcceptBookings)
		.withRefId('ref')
		.build();

	booking.serviceProvider = serviceProvider;
	return booking;
};
