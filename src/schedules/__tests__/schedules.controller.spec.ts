import { Container, Snapshot } from "typescript-ioc";
import { ScheduleRequest } from "../schedules.apicontract";
import SchedulesService from "../schedules.service";
import { SchedulesController } from "../schedules.controller";

const createSchedule = jest.fn();
const updateSchedule = jest.fn();
const deleteSchedule = jest.fn();
const MockSchedulesService = jest.fn().mockImplementation(() => {
	return { createSchedule, updateSchedule, deleteSchedule };
});

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

beforeEach(() => {
	jest.clearAllMocks();
});

const timeslot: ScheduleRequest = new ScheduleRequest('', '', '', '', []);
describe('Test templates timeslots controller', () => {
	it('should test if creat service is called', async () => {
		Container.bind(SchedulesService).to(MockSchedulesService);
		const timeslotsController = Container.get(SchedulesController);

		await timeslotsController.createSchedule(timeslot);
		expect(createSchedule).toBeCalledTimes(1);
	});

	it('should test if upsert service is called', async () => {
		Container.bind(SchedulesService).to(MockSchedulesService);
		const timeslotsController = Container.get(SchedulesController);

		await timeslotsController.updateSchedule(timeslot);
		expect(updateSchedule).toBeCalledTimes(1);
	});

	it('should test if delete service is called', async () => {
		Container.bind(SchedulesService).to(MockSchedulesService);
		const timeslotsController = Container.get(SchedulesController);

		await timeslotsController.deleteSchedule(3);
		expect(deleteSchedule).toBeCalledTimes(1);
	});

});
