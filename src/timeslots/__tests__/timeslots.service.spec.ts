import { Container, Snapshot } from "typescript-ioc";
import { Booking, BookingStatus, Calendar, TemplateTimeslots } from "../../models";
import { TimeslotsService } from "../timeslots.service";
import { CalendarsRepository } from '../../calendars/calendars.repository';
import { AggregatedEntry, TimeslotAggregator } from '../timeslotAggregator';
import { BookingsRepository } from "../../bookings/bookings.repository";
import { Timeslot } from "../../models/Timeslot";
import { DateHelper } from "../../infrastructure/dateHelper";
import { calendar } from "googleapis/build/src/apis/calendar";

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

jest.mock('../timeslotAggregator', () => {
	const getEntriesMock = jest.fn(() => {
		const timeslot = new Timeslot(new Date(Date.UTC(2020, 4, 19, 1, 0)), new Date(Date.UTC(2020, 4, 19, 2, 0)));
		const CalendarMock = new Calendar();
		CalendarMock.id = 2;

		const aggregatedEntryMock = new AggregatedEntry<Calendar>(timeslot);
		aggregatedEntryMock.addGroup(CalendarMock);

		return [aggregatedEntryMock];
	});

	const aggregatorMock = {
		aggregate: jest.fn(),
		clear: jest.fn(),
		getEntries: getEntriesMock
	};

	const actualImplementation = jest.requireActual('../timeslotAggregator');
	return {
		AggregatedEntry: actualImplementation.AggregatedEntry,
		TimeslotAggregator: jest.fn(() => aggregatorMock)
	};
});

describe("Timeslots Service", () => {
	const timeslot = new Timeslot(DateHelper.setHours(new Date(), 15, 0), DateHelper.setHours(new Date(), 16, 0));

	const templateTimeslotMock = {
		generateValidTimeslots: jest.fn(() => [timeslot])
	};

	const CalendarMock = new Calendar();
	CalendarMock.id = 1;

	CalendarMock.templatesTimeslots = templateTimeslotMock as unknown as TemplateTimeslots;

	const CalendarsRepositoryMock = {
		getCalendarsWithTemplates: jest.fn(() => Promise.resolve([CalendarMock]))
	};

	const BookingMock = new Booking(new Date(), 60);
	BookingMock.status = BookingStatus.Accepted;
	BookingMock.eventICalId = 'eventICalId';
	BookingMock.calendar = CalendarMock;

	const BookingsRepositoryMock = {
		search: jest.fn(() => Promise.resolve([BookingMock]))
	};

	it("should aggregate results", async () => {
		Container.bind(CalendarsRepository).to(jest.fn(() => CalendarsRepositoryMock));
		Container.bind(BookingsRepository).to(jest.fn(() => BookingsRepositoryMock));

		const service = Container.get(TimeslotsService);
		const aggregator = new TimeslotAggregator<Calendar>();

		const result = await service.getAggregatedTimeslots(new Date(), new Date());
		expect(result).toBeDefined();

		expect(CalendarsRepositoryMock.getCalendarsWithTemplates).toBeCalled();
		expect(templateTimeslotMock.generateValidTimeslots).toBeCalledTimes(1);
		expect(aggregator.aggregate).toBeCalled();
		expect(aggregator.getEntries).toBeCalled();
	});

	it("should get available calendars", async () => {
		Container.bind(CalendarsRepository).to(jest.fn(() => CalendarsRepositoryMock));
		Container.bind(BookingsRepository).to(jest.fn(() => BookingsRepositoryMock));

		const service = Container.get(TimeslotsService);
		const startDateTime = new Date(Date.UTC(2020, 4, 19, 1, 0));
		const endDateTime = new Date(Date.UTC(2020, 4, 19, 2, 0));

		const aggregator = new TimeslotAggregator<Calendar>();
		const result = await service.getAvailableCalendarsForTimeslot(startDateTime, endDateTime);

		expect(CalendarsRepositoryMock.getCalendarsWithTemplates).toBeCalled();
		expect(templateTimeslotMock.generateValidTimeslots).toBeCalledTimes(1);
		expect(aggregator.aggregate).toBeCalled();
		expect(aggregator.getEntries).toBeCalled();

		expect(result).toHaveLength(1);
	});
});
