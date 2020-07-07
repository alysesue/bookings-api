import { Container, Snapshot } from "typescript-ioc";
import { Booking, BookingStatus, Calendar, Schedule, Service, ServiceProvider, Timeslot } from "../../models";
import { TimeslotsService } from "../timeslots.service";
import { BookingsRepository } from "../../bookings/bookings.repository";
import { DateHelper } from "../../infrastructure/dateHelper";
import { BookingSearchRequest } from '../../bookings/bookings.apicontract';
import { ServicesRepository } from '../../services/services.repository';
import { ServiceProvidersRepository } from "../../serviceProviders/serviceProviders.repository";

let snapshot: Snapshot;
beforeAll(() => {
	// Store the IoC configuration
	snapshot = Container.snapshot();
});

afterEach(() => {
	snapshot.restore();
	// Clears mock counters, not implementation
	jest.clearAllMocks();
});

describe("Timeslots Service", () => {
	const date = new Date(2020, 4, 27);
	const endDate = DateHelper.setHours(date, 11, 59);
	const timeslot = new Timeslot(DateHelper.setHours(date, 15, 0), DateHelper.setHours(date, 16, 0));
	const timeslot2 = new Timeslot(DateHelper.setHours(date, 16, 0), DateHelper.setHours(date, 17, 0));
	const timeslot3 = new Timeslot(DateHelper.setHours(date, 17, 0), DateHelper.setHours(date, 18, 0));

	const ScheduleMock = {
		id: 1,
		generateValidTimeslots: jest.fn(() => [timeslot, timeslot2, timeslot3])
	};

	const ProviderScheduleMock = {
		id: 2,
		generateValidTimeslots: jest.fn(() => [timeslot3])
	};

	const CalendarMock = new Calendar();
	CalendarMock.id = 1;

	const ServiceMock = new Service();
	ServiceMock.id = 1;
	ServiceMock.schedule = ScheduleMock as unknown as Schedule;
	ServiceMock.scheduleId = ScheduleMock.id;

	const ServiceProviderMock = ServiceProvider.create('Provider', CalendarMock, ServiceMock.id);
	ServiceProviderMock.id = 100;

	const ServiceProviderMock2 = ServiceProvider.create('Provider with schedule', CalendarMock, ServiceMock.id);
	ServiceProviderMock2.id = 101;
	ServiceProviderMock2.schedule = ProviderScheduleMock as unknown as Schedule;
	ServiceProviderMock2.scheduleId = ProviderScheduleMock.id;

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
			return (param.status === BookingStatus.Accepted) ? Promise.resolve([BookingMock])
				: Promise.resolve([pendingBookingMock]);
		})
	};

	const ServicesRepositoryMock = {
		getServiceWithSchedule: jest.fn(() => Promise.resolve(ServiceMock))
	};

	const ServiceProvidersRepositoryMock = {
		getServiceProviders: jest.fn(() => Promise.resolve([ServiceProviderMock, ServiceProviderMock2]))
	};

	it("should aggregate results", async () => {
		Container.bind(BookingsRepository).to(jest.fn(() => BookingsRepositoryMock));
		Container.bind(ServicesRepository).to(jest.fn(() => ServicesRepositoryMock));
		Container.bind(ServiceProvidersRepository).to(jest.fn(() => ServiceProvidersRepositoryMock));

		const service = Container.get(TimeslotsService);
		const result = await service.getAggregatedTimeslots(date, endDate, 1);
		expect(result.length).toBe(3);

		expect(ServicesRepositoryMock.getServiceWithSchedule).toBeCalled();
		expect(ScheduleMock.generateValidTimeslots).toBeCalledTimes(1);
	});

	it("should aggregate results by service provider", async () => {
		Container.bind(BookingsRepository).to(jest.fn(() => BookingsRepositoryMock));
		Container.bind(ServicesRepository).to(jest.fn(() => ServicesRepositoryMock));
		Container.bind(ServiceProvidersRepository).to(jest.fn(() => ServiceProvidersRepositoryMock));

		const service = Container.get(TimeslotsService);
		const result = await service.getAggregatedTimeslots(date, endDate, 1, 101);
		expect(result.length).toBe(1);

		expect(ServicesRepositoryMock.getServiceWithSchedule).toBeCalled();
		expect(ScheduleMock.generateValidTimeslots).toBeCalledTimes(1);
	});

	it("should get available providers", async () => {
		Container.bind(BookingsRepository).to(jest.fn(() => BookingsRepositoryMock));
		Container.bind(ServicesRepository).to(jest.fn(() => ServicesRepositoryMock));
		Container.bind(ServiceProvidersRepository).to(jest.fn(() => ServiceProvidersRepositoryMock));

		const service = Container.get(TimeslotsService);
		const startDateTime = DateHelper.setHours(date, 17, 0);
		const endDateTime = DateHelper.setHours(date, 18, 0);
		const result = await service.getAvailableProvidersForTimeslot(startDateTime, endDateTime, 1);

		expect(ServicesRepositoryMock.getServiceWithSchedule).toBeCalled();
		expect(ScheduleMock.generateValidTimeslots).toBeCalledTimes(1);
		expect(ProviderScheduleMock.generateValidTimeslots).toBeCalledTimes(1);

		expect(result.bookedServiceProviders).toHaveLength(1);
		expect(result.availableServiceProviders).toHaveLength(1);
		expect(result.bookedServiceProviders[0].id).not.toBe(result.availableServiceProviders[0]);
	});
});
