import { Container, Snapshot } from "typescript-ioc";
import { Booking, BookingStatus, Calendar, Schedule } from "../../models";
import { TimeslotsService } from "../timeslots.service";
import { CalendarsRepository } from '../../calendars/calendars.repository';
import { AggregatedEntry, TimeslotAggregator } from '../timeslotAggregator';
import { BookingsRepository } from "../../bookings/bookings.repository";
import { Timeslot } from "../../models";
import { DateHelper } from "../../infrastructure/dateHelper";
import { BookingSearchRequest } from '../../bookings/bookings.apicontract';

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

	CalendarMock.schedule = ScheduleMock as unknown as Schedule;

	const CalendarsRepositoryMock = {
		getCalendarsWithTemplates: jest.fn(() => Promise.resolve([CalendarMock]))
	};

	// Booking in place for the first time slot
	const BookingMock = new Booking(DateHelper.setHours(date, 15, 0), 60);
	BookingMock.status = BookingStatus.Accepted;
	BookingMock.eventICalId = 'eventICalId';
	BookingMock.calendar = CalendarMock;
	BookingMock.calendarId = CalendarMock.id;

	const pendingBookingMock = new Booking(DateHelper.setHours(date, 17, 0), 60);
	pendingBookingMock.status = BookingStatus.PendingApproval;

	const BookingsRepositoryMock = {
		search: jest.fn((param: BookingSearchRequest) => {
			return (param.status === BookingStatus.Accepted) ? Promise.resolve([BookingMock])
				: Promise.resolve([pendingBookingMock]);
		})
	};

	it("should aggregate results", async () => {
		Container.bind(CalendarsRepository).to(jest.fn(() => CalendarsRepositoryMock));
		Container.bind(BookingsRepository).to(jest.fn(() => BookingsRepositoryMock));

		const service = Container.get(TimeslotsService);
		const result = await service.getAggregatedTimeslots(date, date);
		expect(result).toBeDefined();

		expect(CalendarsRepositoryMock.getCalendarsWithTemplates).toBeCalled();
		expect(ScheduleMock.generateValidTimeslots).toBeCalledTimes(1);
	});

	it("should get available calendars", async () => {
		Container.bind(CalendarsRepository).to(jest.fn(() => CalendarsRepositoryMock));
		Container.bind(BookingsRepository).to(jest.fn(() => BookingsRepositoryMock));

		const service = Container.get(TimeslotsService);
		const startDateTime = DateHelper.setHours(date, 15, 0);
		const endDateTime = DateHelper.setHours(date, 16, 0);
		const result = await service.getAvailableCalendarsForTimeslot(startDateTime, endDateTime);

		expect(CalendarsRepositoryMock.getCalendarsWithTemplates).toBeCalled();
		expect(ScheduleMock.generateValidTimeslots).toBeCalledTimes(1);

		expect(result).toHaveLength(0);
	});
});
