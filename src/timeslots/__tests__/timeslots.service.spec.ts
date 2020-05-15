import { Container, Snapshot } from "typescript-ioc";
import { Calendar, TemplateTimeslots } from "../../models";
import { TimeslotsService } from "../timeslots.service";
import { CalendarsRepository } from '../../calendars/calendars.repository';
import { TimeslotAggregator } from '../timeslotAggregator';
import { BookingsRepository } from "../../bookings/bookings.repository";
import { Timeslot } from "../../models/Timeslot";
import { DateHelper } from "../../infrastructure/dateHelper";

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

const timeslot = new Timeslot(DateHelper.setHours(new Date(), 15, 0), DateHelper.setHours(new Date(), 16, 0));

const templateTimeslotMock = {
	generateValidTimeslots: jest.fn(() => [timeslot])
};

const CalendarMock = new Calendar();
CalendarMock.templatesTimeslots = templateTimeslotMock as unknown as TemplateTimeslots;

const CalendarsRepositoryMock = {
	getCalendarsWithTemplates: jest.fn(() => Promise.resolve([CalendarMock]))
};

const BookingsRepositoryMock = {
	getBookings: jest.fn(() => Promise.resolve([]))
};

jest.mock('../timeslotAggregator', () => {
	const aggregatorMock = {
		aggregate: jest.fn(),
		clear: jest.fn(),
		getEntries: jest.fn(() => [])
	};

	return {
		TimeslotAggregator: jest.fn(() => aggregatorMock)
	};
});

describe("Timeslots Service", () => {
	it("should aggregate results", async () => {
		Container.bind(CalendarsRepository).to(jest.fn(() => CalendarsRepositoryMock));
		Container.bind(BookingsRepository).to(jest.fn(() => BookingsRepositoryMock));

		const service = Container.get(TimeslotsService);
		const result = await service.getAggregatedTimeslots(new Date(), new Date());
		const aggregator = new TimeslotAggregator<Calendar>();

		expect(result).toBeDefined();

		expect(CalendarsRepositoryMock.getCalendarsWithTemplates).toBeCalled();
		expect(templateTimeslotMock.generateValidTimeslots).toBeCalledTimes(1);
		expect(aggregator.aggregate).toBeCalled();
		expect(aggregator.getEntries).toBeCalled();
	});
});
