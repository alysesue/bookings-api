import TimeslotsService from "../timeslots.service";
import { TimeslotParams } from "../timeslots.apicontract";
import TimeslotsRepository from "../timeslots.repository";
import {Container, Snapshot} from "typescript-ioc";
// import TimeslotsRepository, { mockAddTemplateTimeslots } from "../timeslots.repository";

// jest.mock("../timeslots.repository");
const addTemplateTimeslots = jest.fn();
jest.mock('../timeslots.repository', () => {
	return jest.fn().mockImplementation(() => {
		return {addTemplateTimeslots};
	});
});
const mockedTimeslotsRepository = TimeslotsRepository as jest.Mock<TimeslotsRepository>;
// const mockedTimeslotsRepository = mockAddTemplateTimeslots as jest.Mock<TimeslotsRepository>;

let snapshot: Snapshot;
beforeAll(() => {
	// Store the IoC configuration
	snapshot = Container.snapshot();

	// Clears mock counters, not implementation
	jest.clearAllMocks();
});

afterAll(() => {
	// Put the IoC configuration back for IService, so other tests can run.
	snapshot.restore();
});

describe('Timeslots  template services ', () => {
	beforeEach(() => {
		// Clear all instances and calls to constructor and all methods:
		addTemplateTimeslots.mockClear();
		// mockAddTemplateTimeslots.mockClear();
	});

	it('should do some stuff', async () => {
		const timeslotsService: TimeslotsService = new TimeslotsService();
		const timeslots = new TimeslotParams();
		await timeslotsService.addTemplateTimeslots(new TimeslotParams());
		// console.log(require('util').inspect(mockedTimeslotsRepository.mock.instances[1], false, null, true /* enable colors */));
		console.log(require('util').inspect(addTemplateTimeslots, false, null, true /* enable colors */));
		console.log(require('util').inspect(addTemplateTimeslots.mock, false, null, true /* enable colors */));

		//expect(mockedTimeslotsRepository.mock.instances[0].addTemplateTimeslots()).toBeCalledTimes(0);
	});
});