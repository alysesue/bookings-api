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
	const timeslot = new Timeslot(DateHelper.setHours(date, 15, 0), DateHelper.setHours(date, 16, 0));
	const timeslot2 = new Timeslot(DateHelper.setHours(date, 16, 0), DateHelper.setHours(date, 17, 0));
	const timeslot3 = new Timeslot(DateHelper.setHours(date, 17, 0), DateHelper.setHours(date, 18, 0));

	const ScheduleMock = {
		generateValidTimeslots: jest.fn(() => [timeslot, timeslot2, timeslot3])
	};

	const CalendarMock = new Calendar();
	CalendarMock.id = 1;

	const ServiceMock = new Service();
	ServiceMock.id = 1;
	ServiceMock.schedule = ScheduleMock as unknown as Schedule;

	const ServiceProviderMock = new ServiceProvider(ServiceMock, 'Provider', CalendarMock);
	ServiceProviderMock.id = 1;

	// Booking in place for the first time slot
	const BookingMock = new Booking(1, DateHelper.setHours(date, 15, 0), 60);
	BookingMock.status = BookingStatus.Accepted;
	BookingMock.eventICalId = 'eventICalId';
	BookingMock.serviceProvider = ServiceProviderMock;
	BookingMock.serviceProviderId = ServiceProviderMock.id;

	const pendingBookingMock = new Booking(1, DateHelper.setHours(date, 17, 0), 60);
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
		getServiceProviders: jest.fn(() => Promise.resolve([ServiceProviderMock]))
	};

	it("should aggregate results", async () => {
		Container.bind(BookingsRepository).to(jest.fn(() => BookingsRepositoryMock));
		Container.bind(ServicesRepository).to(jest.fn(() => ServicesRepositoryMock));
		Container.bind(ServiceProvidersRepository).to(jest.fn(() => ServiceProvidersRepositoryMock));

		const service = Container.get(TimeslotsService);
		const result = await service.getAggregatedTimeslots(date, date, 1);
		expect(result).toBeDefined();

		expect(ServicesRepositoryMock.getServiceWithSchedule).toBeCalled();
		expect(ScheduleMock.generateValidTimeslots).toBeCalledTimes(1);
	});

	it("should get available providers", async () => {
		Container.bind(BookingsRepository).to(jest.fn(() => BookingsRepositoryMock));
		Container.bind(ServicesRepository).to(jest.fn(() => ServicesRepositoryMock));
		Container.bind(ServiceProvidersRepository).to(jest.fn(() => ServiceProvidersRepositoryMock));

		const service = Container.get(TimeslotsService);
		const startDateTime = DateHelper.setHours(date, 15, 0);
		const endDateTime = DateHelper.setHours(date, 16, 0);
		const result = await service.getAvailableProvidersForTimeslot(startDateTime, endDateTime, 1);

		expect(ServicesRepositoryMock.getServiceWithSchedule).toBeCalled();
		expect(ScheduleMock.generateValidTimeslots).toBeCalledTimes(1);

		expect(result.serviceProviders).toHaveLength(0);
	});
});
