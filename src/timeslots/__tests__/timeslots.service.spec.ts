import { Container, Snapshot } from "typescript-ioc";
import { Calendar } from "../../models";
import { TimeslotsService } from "../timeslots.service";
import { CalendarsRepository } from '../../calendars/calendars.repository';
import { TimeslotAggregator } from '../timeslotAggregator';

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

const templateTimeslotMock = {
	generateValidTimeslots: jest.fn(() => [])
};

const CalendarsMock = [
	{
		templateTimeslots: [templateTimeslotMock, templateTimeslotMock]
	} as unknown as Calendar
];

const CalendarsRepositoryMock = {
	getCalendarsWithTemplates: jest.fn(() => Promise.resolve(CalendarsMock))
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

		const service = Container.get(TimeslotsService);
		const result = await service.getAggregatedTimeslots(new Date(), new Date());
		const aggregator = new TimeslotAggregator<Calendar>();

		expect(result).toBeDefined();

		expect(CalendarsRepositoryMock.getCalendarsWithTemplates).toBeCalled();
		expect(templateTimeslotMock.generateValidTimeslots).toBeCalledTimes(2);
		expect(aggregator.aggregate).toBeCalled();
		expect(aggregator.getEntries).toBeCalled();
	});
});
