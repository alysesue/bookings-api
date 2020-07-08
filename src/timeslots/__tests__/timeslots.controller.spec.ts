import { Container } from "typescript-ioc";
import { TimeslotsController } from "../timeslots.controller";
import { TimeslotsService } from "../timeslots.service";
import { AvailableTimeslotProviders } from '../availableTimeslotProviders';
import { DateHelper } from "../../infrastructure/dateHelper";

const TimeslotsServiceMock = {
	getAggregatedTimeslots: jest.fn(() => Promise.resolve([]))
};

beforeEach(() => {
	Container.bind(TimeslotsService).to(jest.fn(() => TimeslotsServiceMock));
});

afterEach(() => {
	jest.resetAllMocks();
});

describe("Timeslots Controller", () => {
	it("should get availability", async () => {
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders();
			entry.startTime = new Date();
			entry.startTime = DateHelper.addMinutes(entry.startTime, 30);
			return Promise.resolve([entry]);
		});

		const controller = Container.get(TimeslotsController);
		const result = await controller.getAvailability(new Date(), new Date(), 1, 100);

		expect(result).toBeDefined();
		// zero availabilityCount not returned
		expect(result.length).toBe(0);
		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalled();
	});

	it("should get timeslots", async () => {
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders();
			entry.startTime = new Date();
			entry.startTime = DateHelper.addMinutes(entry.startTime, 30);
			return Promise.resolve([entry]);
		});

		const controller = Container.get(TimeslotsController);
		const result = await controller.getTimeslots(new Date(), new Date(), 1, 100);

		expect(result).toBeDefined();
		expect(result.length).toBe(1);
		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalled();
	});
});
