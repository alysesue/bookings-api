import { Container } from 'typescript-ioc';
import {
	Booking,
	BookingStatus,
	Calendar,
	Service,
	ServiceProvider,
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
import { TimeslotWithCapacity } from '../../../models/timeslotWithCapacity';

afterAll(() => {
	jest.resetAllMocks();
	jest.clearAllMocks();
	if (global.gc) global.gc();
});

// tslint:disable-next-line:no-big-function
describe('Timeslots Service', () => {
	const date = new Date(2020, 4, 27);
	const endDate = DateHelper.setHours(date, 11, 59);
	const timeslot = new TimeslotWithCapacity(DateHelper.setHours(date, 15, 0), DateHelper.setHours(date, 16, 0));
	const timeslot2 = new TimeslotWithCapacity(DateHelper.setHours(date, 16, 0), DateHelper.setHours(date, 17, 0));
	const timeslot3 = new TimeslotWithCapacity(DateHelper.setHours(date, 17, 0), DateHelper.setHours(date, 18, 0));
	const timeslot4 = new TimeslotWithCapacity(DateHelper.setHours(date, 18, 30), DateHelper.setHours(date, 19, 30));

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

	const ServiceProviderMock = ServiceProvider.create('Provider', ServiceMock.id);
	ServiceProviderMock.id = 100;
	ServiceProviderMock.calendar = CalendarMock;

	const ServiceProviderMock2 = ServiceProvider.create('Provider with schedule', ServiceMock.id);
	ServiceProviderMock2.id = 101;
	ServiceProviderMock2.calendar = CalendarMock;
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
	unavailability2.allServiceProviders = false;
	unavailability2.serviceProviders = [ServiceProviderMock];
	unavailability2.start = DateHelper.setHours(date, 19, 0);
	unavailability2.end = DateHelper.setHours(date, 20, 0);

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
		jest.clearAllMocks();

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

	it('should return empty aggregation entry', async () => {
		const service = Container.get(TimeslotsService);
		ServicesRepositoryMock.getServiceWithTimeslotsSchedule.mockImplementation(() => Promise.resolve(null));

		const result = await service.getAggregatedTimeslots(date, endDate, 2);
		expect(result.length).toBe(0);
	});

	it('should get no available service providers at this timeslot', async () => {
		const service = Container.get(TimeslotsService);
		const startDateTime = DateHelper.setHours(date, 17, 0);
		const endDateTime = DateHelper.setHours(date, 18, 0);
		const result = await service.getAvailableProvidersForTimeslot(startDateTime, endDateTime, 1, 100);
		expect(result.length).toBe(0);
	});

	it('should get available service providers at this timeslot', async () => {
		const service = Container.get(TimeslotsService);
		const startDateTime = DateHelper.setHours(date, 16, 0);
		const endDateTime = DateHelper.setHours(date, 17, 0);
		const result = await service.getAvailableProvidersForTimeslot(startDateTime, endDateTime, 1);
		expect(result.length).toBe(1);
		expect(result[0].availabilityCount).toBe(1);
	});

	it('should return TRUE if service provider is available at this timeslot', async () => {
		const service = Container.get(TimeslotsService);
		const startDateTime = DateHelper.setHours(date, 16, 0);
		const endDateTime = DateHelper.setHours(date, 17, 0);
		const result = await service.isProviderAvailableForTimeslot(startDateTime, endDateTime, 1, 100);
		expect(result).toBe(true);
	});

	it('should return FALSE if service provider is unavailable at this timeslot', async () => {
		const service = Container.get(TimeslotsService);
		const startDateTime = DateHelper.setHours(date, 17, 0);
		const endDateTime = DateHelper.setHours(date, 18, 0);
		const result1 = await service.isProviderAvailableForTimeslot(startDateTime, endDateTime, 1, 100);
		expect(result1).toBe(false);
		const result2 = await service.isProviderAvailableForTimeslot(startDateTime, endDateTime, 1, 101);
		expect(result2).toBe(false);
	});

	it('should merge bookings with same time range', async () => {
		const service = Container.get(TimeslotsService);

		const testBooking1 = getOutOfSlotBooking(ServiceProviderMock);
		const testBooking2 = getOutOfSlotBooking(ServiceProviderMock2);
		BookingsRepositoryMock.search.mockReturnValue(Promise.resolve([]));
		BookingsRepositoryMock.search.mockImplementation(() => Promise.resolve([testBooking1, testBooking2]));

		const res = await service.getAggregatedTimeslots(date, endDate, 1, true);

		expect(res.length).toBe(4);

		expect(res[0].startTime.getHours()).toBe(8);
		expect(res[0].endTime.getHours()).toBe(11);
		expect(res[1].startTime.getHours()).toBe(15);
		expect(res[1].endTime.getHours()).toBe(16);
		expect(res[2].startTime.getHours()).toBe(16);
		expect(res[2].endTime.getHours()).toBe(17);
		expect(res[3].startTime.getHours()).toBe(17);
		expect(res[3].endTime.getHours()).toBe(18);
	});

	it('should filter out bookings not related to an authorised role', async () => {
		TimeslotsScheduleMock.generateValidTimeslots.mockReturnValue([]);

		const testBookings = [
			new BookingBuilder()
				.withServiceId(1)
				.withStartDateTime(DateHelper.setHours(date, 17, 0))
				.withEndDateTime(DateHelper.setHours(date, 18, 0))
				.withServiceProviderId(1)
				.withAutoAccept(true)
				.build(),
			new BookingBuilder()
				.withServiceId(1)
				.withStartDateTime(DateHelper.setHours(date, 17, 0))
				.withEndDateTime(DateHelper.setHours(date, 18, 0))
				.withServiceProviderId(2)
				.withAutoAccept(true)
				.build(),
		];

		testBookings[0].serviceProvider = ServiceProviderMock;
		testBookings[1].serviceProvider = ServiceProviderMock2;

		BookingsRepositoryMock.search.mockReturnValue(testBookings);

		ServiceProvidersRepositoryMock.getServiceProviders.mockReturnValue([ServiceProviderMock2]);

		const service = Container.get(TimeslotsService);
		const timeslots = await service.getAggregatedTimeslots(date, endDate, 1, true);
		expect(timeslots).toHaveLength(1);

		const timeslotSPs = Array.from(timeslots[0].getTimeslotServiceProviders());
		expect(timeslotSPs).toHaveLength(1);
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
		const spTimeslot = Array.from(timeslots[0].getTimeslotServiceProviders());
		expect(spTimeslot[0].acceptedBookings.length).toBe(1);
		expect(setBookedServiceProviders).toHaveBeenCalled();
	});
});

const getOutOfSlotBooking = (serviceProvider: ServiceProvider): Booking => {
	const date = new Date(2020, 4, 27, 8, 0, 0);
	const endDate = DateHelper.setHours(date, 11, 0);

	const booking = new BookingBuilder()
		.withServiceId(1)
		.withStartDateTime(date)
		.withEndDateTime(endDate)
		.withServiceProviderId(serviceProvider.id)
		.withAutoAccept(true)
		.withRefId('ref')
		.build();

	booking.serviceProvider = serviceProvider;
	return booking;
};
