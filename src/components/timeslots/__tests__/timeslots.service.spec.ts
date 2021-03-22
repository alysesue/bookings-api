import { Container } from 'typescript-ioc';
import {
	Booking,
	BookingStatus,
	OneOffTimeslot,
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
import { IPagedEntities } from '../../../core/pagedEntities';
import { OneOffTimeslotsRepository } from '../../../components/oneOffTimeslots/oneOffTimeslots.repository';

afterAll(() => {
	jest.resetAllMocks();
	jest.clearAllMocks();
	if (global.gc) global.gc();
});

const BookingsRepositoryMock = {
	search: jest.fn<Promise<IPagedEntities<Booking>>, any>(),
};

const ServicesRepositoryMock = {
	getServiceWithTimeslotsSchedule: jest.fn(),
};

const ServiceProvidersRepositoryMock = {
	getServiceProviders: jest.fn(),
};

const TimeslotsScheduleMock = {
	_id: 1,
	generateValidTimeslots: jest.fn(),
};

const ProviderScheduleMock = {
	_id: 2,
	generateValidTimeslots: jest.fn(),
};

const UnavailabilitiesServiceMock = {
	search: jest.fn(),
};

const OneOffTimeslotsRepositoryMock: Partial<OneOffTimeslotsRepository> = {
	search: jest.fn(),
};

const createTimeslot = (startTime: Date, endTime: Date, capacity?: number) => {
	return {
		startTimeNative: startTime.getTime(),
		endTimeNative: endTime.getTime(),
		capacity: capacity || 1,
	} as TimeslotWithCapacity;
};

// tslint:disable-next-line:no-big-function
describe('Timeslots Service', () => {
	const date = new Date(2020, 4, 27);
	const endDate = DateHelper.setHours(date, 23, 59);
	const timeslot = createTimeslot(DateHelper.setHours(date, 15, 0), DateHelper.setHours(date, 16, 0));
	const timeslot2 = createTimeslot(DateHelper.setHours(date, 16, 0), DateHelper.setHours(date, 17, 0));
	const timeslot3 = createTimeslot(DateHelper.setHours(date, 17, 0), DateHelper.setHours(date, 18, 0));
	const timeslot4 = createTimeslot(DateHelper.setHours(date, 18, 30), DateHelper.setHours(date, 19, 30));

	const ServiceMock = new Service();
	ServiceMock.id = 1;
	ServiceMock.timeslotsSchedule = (TimeslotsScheduleMock as unknown) as TimeslotsSchedule;
	ServiceMock.timeslotsScheduleId = TimeslotsScheduleMock._id;
	ServiceMock.isOnHold = false;

	const ServiceProviderMock = ServiceProvider.create('Provider', ServiceMock.id);
	ServiceProviderMock.id = 100;

	const ServiceProviderMock2 = ServiceProvider.create('Provider with schedule', ServiceMock.id);
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
	BookingMock.serviceProvider = ServiceProviderMock;
	BookingMock.serviceProviderId = ServiceProviderMock.id;

	pendingBookingMock.status = BookingStatus.PendingApproval;

	const unavailability1 = new Unavailability();
	unavailability1.allServiceProviders = true;
	unavailability1.start = DateHelper.setHours(date, 22, 0);
	unavailability1.end = DateHelper.setHours(date, 23, 0);

	const unavailability2 = new Unavailability();
	unavailability2.allServiceProviders = false;
	unavailability2.serviceProviders = [ServiceProviderMock];
	unavailability2.start = DateHelper.setHours(date, 19, 0);
	unavailability2.end = DateHelper.setHours(date, 20, 0);

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
		Container.bind(OneOffTimeslotsRepository).factory(() => {
			return OneOffTimeslotsRepositoryMock;
		});
	});

	beforeEach(() => {
		BookingsRepositoryMock.search.mockImplementation(() => {
			return Promise.resolve({ entries: [pendingBookingMock, BookingMock] } as IPagedEntities<Booking>);
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

		(OneOffTimeslotsRepositoryMock.search as jest.Mock).mockReturnValue(Promise.resolve([]));
	});

	afterEach(() => {
		jest.resetAllMocks();
		jest.clearAllMocks();
	});

	it('should aggregate results', async () => {
		const service = Container.get(TimeslotsService);
		const result = await service.getAggregatedTimeslots(date, endDate, 1);
		const filtered = result.filter((e) => e.getAvailabilityCount() > 0);

		expect(result.length).toBe(3);
		expect(filtered.length).toBe(2);

		expect(ServicesRepositoryMock.getServiceWithTimeslotsSchedule).toBeCalled();
		expect(TimeslotsScheduleMock.generateValidTimeslots).toBeCalledTimes(1);
	});

	it('should aggregate results by service provider', async () => {
		const service = Container.get(TimeslotsService);
		const result = await service.getAggregatedTimeslots(date, endDate, 1, false, [101]);
		expect(result.length).toBe(1);

		expect(ServicesRepositoryMock.getServiceWithTimeslotsSchedule).toBeCalled();
		expect(TimeslotsScheduleMock.generateValidTimeslots).toBeCalledTimes(1);
	});

	it('should override schedule timeslots with one off timeslots', async () => {
		const oneOffTimeslots = new OneOffTimeslot();
		oneOffTimeslots.startDateTime = DateHelper.setHours(date, 16, 30);
		oneOffTimeslots.endDateTime = DateHelper.setHours(date, 20, 30);
		oneOffTimeslots.capacity = 5;
		oneOffTimeslots.serviceProvider = ServiceProviderMock2;
		oneOffTimeslots.serviceProviderId = ServiceProviderMock2.id;

		(OneOffTimeslotsRepositoryMock.search as jest.Mock).mockReturnValue(Promise.resolve([oneOffTimeslots]));

		const service = Container.get(TimeslotsService);
		const result = await service.getAggregatedTimeslots(date, endDate, 1, false, [ServiceProviderMock2.id]);

		expect(result.length).toBe(1);
		expect(new Date(result[0].startTime)).toEqual(oneOffTimeslots.startDateTime);
		expect(new Date(result[0].endTime)).toEqual(oneOffTimeslots.endDateTime);

		const providers = Array.from(result[0].getTimeslotServiceProviders());
		expect(providers.length).toBe(1);
		expect(providers[0].capacity).toBe(5);
	});

	it('should test when there is a pending booking', async () => {
		const service = Container.get(TimeslotsService);

		const startDateTime = DateHelper.setHours(date, 17, 0);
		const endDateTime = DateHelper.setHours(date, 18, 0);

		const result = await service.getAvailableProvidersForTimeslot(startDateTime, endDateTime, 1, true);
		expect(result.length).toBe(1);
		const result1 = await service.isProviderAvailableForTimeslot(startDateTime, endDateTime, 1, 100, true);
		expect(result1).toBe(false);
		const result2 = await service.isProviderAvailableForTimeslot(startDateTime, endDateTime, 1, 101, true);
		expect(result2).toBe(true);
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
		const result = await service.getAvailableProvidersForTimeslot(startDateTime, endDateTime, 1, true, 100);
		expect(result.length).toBe(0);
	});

	it('should get available service providers at this timeslot', async () => {
		const service = Container.get(TimeslotsService);
		const startDateTime = DateHelper.setHours(date, 16, 0);
		const endDateTime = DateHelper.setHours(date, 17, 0);
		const result = await service.getAvailableProvidersForTimeslot(startDateTime, endDateTime, 1, true);
		expect(result.length).toBe(1);
		expect(result[0].availabilityCount).toBe(1);
	});

	it('should return TRUE if service provider is available at this timeslot', async () => {
		const service = Container.get(TimeslotsService);
		const startDateTime = DateHelper.setHours(date, 16, 0);
		const endDateTime = DateHelper.setHours(date, 17, 0);
		const result = await service.isProviderAvailableForTimeslot(startDateTime, endDateTime, 1, 100, true);
		expect(result).toBe(true);
	});

	it('should return service provider availability at this timeslot', async () => {
		const service = Container.get(TimeslotsService);
		const startDateTime = DateHelper.setHours(date, 17, 0);
		const endDateTime = DateHelper.setHours(date, 18, 0);
		const result1 = await service.isProviderAvailableForTimeslot(startDateTime, endDateTime, 1, 100, true);
		expect(result1).toBe(false);
		const result2 = await service.isProviderAvailableForTimeslot(startDateTime, endDateTime, 1, 101, true);
		expect(result2).toBe(true);
	});

	it('should merge bookings with same time range', async () => {
		const service = Container.get(TimeslotsService);

		const testBooking1 = getOutOfSlotBooking(ServiceProviderMock);
		const testBooking2 = getOutOfSlotBooking(ServiceProviderMock2);

		BookingsRepositoryMock.search.mockImplementation(() =>
			Promise.resolve({ entries: [testBooking1, testBooking2] } as IPagedEntities<Booking>),
		);

		const res = await service.getAggregatedTimeslots(date, endDate, 1, true);

		expect(res.length).toBe(4);

		expect(new Date(res[0].startTime).getHours()).toBe(8);
		expect(new Date(res[0].endTime).getHours()).toBe(11);
		expect(new Date(res[1].startTime).getHours()).toBe(15);
		expect(new Date(res[1].endTime).getHours()).toBe(16);
		expect(new Date(res[2].startTime).getHours()).toBe(16);
		expect(new Date(res[2].endTime).getHours()).toBe(17);
		expect(new Date(res[3].startTime).getHours()).toBe(17);
		expect(new Date(res[3].endTime).getHours()).toBe(18);
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

		BookingsRepositoryMock.search.mockReturnValue(
			Promise.resolve({ entries: testBookings } as IPagedEntities<Booking>),
		);

		ServiceProvidersRepositoryMock.getServiceProviders.mockReturnValue([ServiceProviderMock2]);

		const service = Container.get(TimeslotsService);
		const timeslots = await service.getAggregatedTimeslots(date, endDate, 1, true);
		expect(timeslots).toHaveLength(1);

		const timeslotSPs = Array.from(timeslots[0].getTimeslotServiceProviders());
		expect(timeslotSPs).toHaveLength(1);
	});

	it('should get no available service providers because all sp are unavailable', async () => {
		const service = Container.get(TimeslotsService);
		const startDateTime = DateHelper.setHours(date, 22, 0);
		const endDateTime = DateHelper.setHours(date, 23, 0);
		const result = await service.getAvailableProvidersForTimeslot(startDateTime, endDateTime, 1, true);
		expect(result.length).toBe(0);
		const result1 = await service.isProviderAvailableForTimeslot(startDateTime, endDateTime, 1, 100, true);
		expect(result1).toBe(false);
		const result2 = await service.isProviderAvailableForTimeslot(startDateTime, endDateTime, 1, 101, true);
		expect(result2).toBe(false);
	});

	it('should not return the overlapped timeslot', async () => {
		const service = Container.get(TimeslotsService);
		ServiceProvidersRepositoryMock.getServiceProviders.mockImplementation(() =>
			Promise.resolve([ServiceProviderMock, ServiceProviderMock2]),
		);
		const timeslots = await service.getAggregatedTimeslots(date, endDate, 1, true);
		expect(timeslots.length).toBe(3);

		const bookingStartTime = DateHelper.setHours(date, 15, 0);
		const bookingEndDate = DateHelper.setHours(date, 16, 30);
		const bookingOos = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(bookingStartTime)
			.withEndDateTime(bookingEndDate)
			.withServiceProviderId(ServiceProviderMock.id)
			.withAutoAccept(true)
			.withRefId('ref')
			.build();
		bookingOos.serviceProvider = ServiceProviderMock;

		BookingsRepositoryMock.search.mockReturnValue(
			Promise.resolve({ entries: [bookingOos] } as IPagedEntities<Booking>),
		);

		const newTimeslots = await service.getAggregatedTimeslots(date, endDate, 1, true);
		expect(newTimeslots.length).toBe(2);

		const timeslotSps = Array.from(newTimeslots[0].getTimeslotServiceProviders());
		expect(timeslotSps[0].serviceProvider).toBe(ServiceProviderMock);
		expect(timeslotSps[0].acceptedBookings[0]).toBe(bookingOos);
	});

	it('should get no available service providers because all sp are unavailable', async () => {
		const service = Container.get(TimeslotsService);
		const startDateTime = DateHelper.setHours(date, 22, 0);
		const endDateTime = DateHelper.setHours(date, 23, 0);
		const result = await service.getAvailableProvidersForTimeslot(startDateTime, endDateTime, 1, true);
		expect(result.length).toBe(0);
		const result1 = await service.isProviderAvailableForTimeslot(startDateTime, endDateTime, 1, 100, true);
		expect(result1).toBe(false);
		const result2 = await service.isProviderAvailableForTimeslot(startDateTime, endDateTime, 1, 101, true);
		expect(result2).toBe(false);
	});

	it('should create timeslotSchedule Options for same day', async () => {
		const service = Container.get(TimeslotsService);
		const startDateTime = DateHelper.setHours(date, 8, 0);
		const endDateTime = DateHelper.setHours(date, 9, 0);

		const options = service.createTimeslotScheduleOptions(startDateTime, endDateTime);
		expect(JSON.stringify(options)).toEqual(
			JSON.stringify({ weekDays: [3], startTime: '08:00', endTime: '09:00' }),
		);
	});

	it('should create timeslotSchedule Options for next day', async () => {
		const service = Container.get(TimeslotsService);
		const startDateTime = DateHelper.setHours(date, 8, 0);
		const endDateTime = new Date(DateHelper.addDays(date, 1).setHours(9, 0));

		const options = service.createTimeslotScheduleOptions(startDateTime, endDateTime);
		expect(JSON.stringify(options)).toEqual(JSON.stringify({ weekDays: [3, 4] }));
	});

	it('should create timeslotSchedule Options for less than a week date range', async () => {
		const service = Container.get(TimeslotsService);
		const startDateTime = DateHelper.setHours(date, 8, 0);
		const endDateTime = new Date(DateHelper.addDays(date, 5).setHours(7, 0));

		const options = service.createTimeslotScheduleOptions(startDateTime, endDateTime);
		expect(JSON.stringify(options)).toEqual(JSON.stringify({ weekDays: [3, 4, 5, 6, 0, 1] }));
	});

	it('should NOT create timeslotSchedule Options a week or more date range', async () => {
		const service = Container.get(TimeslotsService);
		const startDateTime = DateHelper.setHours(date, 8, 0);
		const endDateTime = new Date(DateHelper.addDays(date, 6).setHours(7, 0));

		const options = service.createTimeslotScheduleOptions(startDateTime, endDateTime);
		expect(JSON.stringify(options)).toEqual(JSON.stringify({}));
	});
});

describe('Timeslots Service Out Of Slot', () => {
	const date = new Date(2020, 4, 27);
	const endDate = DateHelper.setHours(date, 11, 59);

	const ServiceMock = new Service();
	ServiceMock.id = 1;
	ServiceMock.timeslotsSchedule = (TimeslotsScheduleMock as unknown) as TimeslotsSchedule;
	ServiceMock.timeslotsScheduleId = TimeslotsScheduleMock._id;

	const ServiceProviderMock = ServiceProvider.create('Provider', ServiceMock.id);
	ServiceProviderMock.id = 100;

	const ServiceProviderMock2 = ServiceProvider.create('Provider with schedule', ServiceMock.id);
	ServiceProviderMock2.id = 101;
	ServiceProviderMock2.timeslotsSchedule = (ProviderScheduleMock as unknown) as TimeslotsSchedule;
	ServiceProviderMock2.timeslotsScheduleId = ProviderScheduleMock._id;

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
	});

	it('should map accepted out-of-slot booking to timeslot response', async () => {
		const service = Container.get(TimeslotsService);
		const ServiceProviderMock3 = ServiceProvider.create('New Sp', ServiceMock.id);
		ServiceProviderMock3.id = 105;
		ServiceProvidersRepositoryMock.getServiceProviders.mockImplementation(() =>
			Promise.resolve([ServiceProviderMock, ServiceProviderMock2, ServiceProviderMock3]),
		);

		const originalSetBookedServiceProviders = AvailableTimeslotProviders.prototype.setBookedServiceProviders;
		const setBookedServiceProviders = (AvailableTimeslotProviders.prototype.setBookedServiceProviders = jest.fn(
			originalSetBookedServiceProviders,
		));

		TimeslotsScheduleMock.generateValidTimeslots.mockImplementation(() => []);
		BookingsRepositoryMock.search.mockReturnValue(Promise.resolve({ entries: [] } as IPagedEntities<Booking>));
		UnavailabilitiesServiceMock.search.mockImplementation(() => Promise.resolve([]));

		const bookingStartTime = DateHelper.setHours(date, 17, 0);
		const bookingEndDate = DateHelper.setHours(date, 18, 0);
		const bookingOos = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(bookingStartTime)
			.withEndDateTime(bookingEndDate)
			.withServiceProviderId(ServiceProviderMock3.id)
			.withAutoAccept(true)
			.withRefId('ref')
			.build();
		bookingOos.serviceProvider = ServiceProviderMock3;

		BookingsRepositoryMock.search.mockReturnValue(
			Promise.resolve({ entries: [bookingOos] } as IPagedEntities<Booking>),
		);

		const timeslots = await service.getAggregatedTimeslots(date, endDate, 1, true);
		expect(timeslots.length).toBe(1);
		const spTimeslot = Array.from(timeslots[0].getTimeslotServiceProviders());
		expect(spTimeslot[0].acceptedBookings.length).toBe(1);
		expect(spTimeslot[0].serviceProvider).toBe(ServiceProviderMock3);
		expect(spTimeslot[0].capacity).toBe(0);
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
