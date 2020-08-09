import { Container, Snapshot } from "typescript-ioc";
import { Booking, BookingStatus, Calendar, Service, ServiceProvider, Timeslot, TimeslotsSchedule } from "../../models";
import { TimeslotsService } from "../timeslots.service";
import { BookingsRepository } from "../../bookings/bookings.repository";
import { DateHelper } from "../../infrastructure/dateHelper";
import { BookingSearchRequest } from '../../bookings/bookings.apicontract';
import { ServicesRepository } from '../../services/services.repository';
import { ServiceProvidersRepository } from "../../serviceProviders/serviceProviders.repository";
import { AvailableTimeslotProviders } from "../availableTimeslotProviders";
import exp from "constants";

let snapshot: Snapshot;

describe("Timeslots Service", () => {
	const date = new Date(2020, 4, 27);
	const endDate = DateHelper.setHours(date, 11, 59);
	const timeslot = new Timeslot(DateHelper.setHours(date, 15, 0), DateHelper.setHours(date, 16, 0));
	const timeslot2 = new Timeslot(DateHelper.setHours(date, 16, 0), DateHelper.setHours(date, 17, 0));
	const timeslot3 = new Timeslot(DateHelper.setHours(date, 17, 0), DateHelper.setHours(date, 18, 0));

	const TimeslotsScheduleMock = {
		_id: 1,
		generateValidTimeslots: jest.fn(() => [timeslot, timeslot2, timeslot3])
	} as unknown as TimeslotsSchedule;

	const ProviderScheduleMock = {
		_id: 2,
		generateValidTimeslots: jest.fn(() => [timeslot3])
	} as unknown as TimeslotsSchedule;

	const CalendarMock = new Calendar();
	CalendarMock.id = 1;

	const ServiceMock = new Service();
	ServiceMock.id = 1;
	ServiceMock.timeslotsSchedule = TimeslotsScheduleMock;
	ServiceMock.timeslotsScheduleId = TimeslotsScheduleMock._id;

	const ServiceProviderMock = ServiceProvider.create('Provider', CalendarMock, ServiceMock.id);
	ServiceProviderMock.id = 100;

	const ServiceProviderMock2 = ServiceProvider.create('Provider with schedule', CalendarMock, ServiceMock.id);
	ServiceProviderMock2.id = 101;
	ServiceProviderMock2.timeslotsSchedule = ProviderScheduleMock;
	ServiceProviderMock2.timeslotsScheduleId = ProviderScheduleMock._id;

	// Booking in place for the last time slot
	const BookingMock = Booking.create(1, DateHelper.setHours(date, 17, 0), 60);
	BookingMock.status = BookingStatus.Accepted;
	BookingMock.eventICalId = 'eventICalId';
	BookingMock.serviceProvider = ServiceProviderMock;
	BookingMock.serviceProviderId = ServiceProviderMock.id;

	const pendingBookingMock = Booking.create(1, DateHelper.setHours(date, 17, 0), 60);
	pendingBookingMock.status = BookingStatus.PendingApproval;

	const BookingsRepositoryMock = {
		search: jest.fn((param: BookingSearchRequest) => {
			return (param.statuses.includes(BookingStatus.Accepted)) ? Promise.resolve([BookingMock])
				: Promise.resolve([pendingBookingMock]);
		})
	};

	const ServicesRepositoryMock = {
		getServiceWithTimeslotsSchedule: jest.fn(() => Promise.resolve(ServiceMock))
	};

	const ServiceProvidersRepositoryMock = {
		getServiceProviders: jest.fn(() => Promise.resolve([ServiceProviderMock, ServiceProviderMock2]))
	};

	beforeAll(() => {
		// Store the IoC configuration
		snapshot = Container.snapshot();
	});

	afterEach(() => {
		snapshot.restore();
		// Clears mock counters, not implementation
		jest.clearAllMocks();
	});

	beforeEach(() => {
		Container.bind(BookingsRepository).to(jest.fn(() => BookingsRepositoryMock));
		Container.bind(ServicesRepository).to(jest.fn(() => ServicesRepositoryMock));
		Container.bind(ServiceProvidersRepository).to(jest.fn(() => ServiceProvidersRepositoryMock));
	})

	it("should aggregate results", async () => {
		const service = Container.get(TimeslotsService);
		const result = await service.getAggregatedTimeslots(date, endDate, 1);
		expect(result.length).toBe(3);

		expect(ServicesRepositoryMock.getServiceWithTimeslotsSchedule).toBeCalled();
		expect(TimeslotsScheduleMock.generateValidTimeslots).toBeCalledTimes(1);
	});

	it("should aggregate results by service provider", async () => {
		const service = Container.get(TimeslotsService);
		const result = await service.getAggregatedTimeslots(date, endDate, 1, false, 101);
		expect(result.length).toBe(1);

		expect(ServicesRepositoryMock.getServiceWithTimeslotsSchedule).toBeCalled();
		expect(TimeslotsScheduleMock.generateValidTimeslots).toBeCalledTimes(1);
	});

	it("should get available providers", async () => {
		const service = Container.get(TimeslotsService);
		const startDateTime = DateHelper.setHours(date, 17, 0);
		const endDateTime = DateHelper.setHours(date, 18, 0);
		const result = await service.getAvailableProvidersForTimeslot(startDateTime, endDateTime, 1);

		const setRelatedServiceProviders = AvailableTimeslotProviders.prototype.setRelatedServiceProviders = jest.fn();
		const setBookedServiceProviders = AvailableTimeslotProviders.prototype.setBookedServiceProviders = jest.fn();
		const setOverlappingServiceProviders = AvailableTimeslotProviders.prototype.setOverlappingServiceProviders = jest.fn();

		const availableTimeslotProvidersMock = new AvailableTimeslotProviders();
		availableTimeslotProvidersMock.setRelatedServiceProviders([ServiceProviderMock]);
		availableTimeslotProvidersMock.setOverlappingServiceProviders([1]);
		availableTimeslotProvidersMock.setBookedServiceProviders([1]);

		expect(ServicesRepositoryMock.getServiceWithTimeslotsSchedule).toBeCalled();
		expect(TimeslotsScheduleMock.generateValidTimeslots).toBeCalledTimes(1);
		expect(ProviderScheduleMock.generateValidTimeslots).toBeCalledTimes(1);

		expect(setRelatedServiceProviders).toBeCalledTimes(1);
		expect(setBookedServiceProviders).toBeCalledTimes(1);
		expect(setOverlappingServiceProviders).toBeCalledTimes(1);

		expect(result.bookedServiceProviders).toHaveLength(1);
		expect(result.availableServiceProviders).toHaveLength(1);
		expect(result.bookedServiceProviders[0].id).not.toBe(result.availableServiceProviders[0]);
	});

	it('should map accepted out-of-slot booking to timeslot response', async () => {
		const service = Container.get(TimeslotsService);

		const setBookedServiceProviders = AvailableTimeslotProviders.prototype.setBookedServiceProviders = jest.fn();

		const serviceProvider = ServiceProvider.create('Juku', undefined, 1);
		serviceProvider.id = 1;

		const availableTimeslotProvidersMock = new AvailableTimeslotProviders();
		availableTimeslotProvidersMock.setRelatedServiceProviders([serviceProvider]);
		availableTimeslotProvidersMock.setBookedServiceProviders([serviceProvider.id]);

		BookingsRepositoryMock.search.mockReturnValue(Promise.resolve([getOutOfSlotBooking(serviceProvider)]));

		const timeslots = await service.getAggregatedTimeslots(new Date(), new Date(), 1, true);

		expect(timeslots.length).toBe(4);
		expect(setBookedServiceProviders).toHaveBeenCalledWith([serviceProvider.id])
	});

	it('should merge bookings with same time range', async () => {
		const service = Container.get(TimeslotsService);

		const setBookedServiceProviders = AvailableTimeslotProviders.prototype.setBookedServiceProviders = jest.fn();

		const serviceProvider1 = ServiceProvider.create('Juku', undefined, 1);
		const serviceProvider2 = ServiceProvider.create('Andi', undefined, 1);
		serviceProvider1.id = 1;
		serviceProvider2.id = 2;

		BookingsRepositoryMock.search.mockReturnValue(Promise.resolve([getOutOfSlotBooking(serviceProvider1), getOutOfSlotBooking(serviceProvider2)]));

		await service.getAggregatedTimeslots(new Date(), new Date(), 1, true);

		expect(setBookedServiceProviders).toHaveBeenCalledWith([serviceProvider1.id, serviceProvider2.id])
	});
});

const getOutOfSlotBooking = (serviceProvider: ServiceProvider): Booking => {
	const booking = Booking.create(1, new Date('2020-08-08T06:00Z'), 180, serviceProvider.id, 'ref');
	booking.serviceProvider = serviceProvider;
	return booking;
}
