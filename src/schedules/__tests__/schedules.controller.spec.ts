import { Container, Snapshot } from "typescript-ioc";
import { ScheduleRequest, WeekDayScheduleContract } from "../schedules.apicontract";
import { SchedulesService } from "../schedules.service";
import { SchedulesController } from "../schedules.controller";
import { Weekday } from '../../enums/weekday';

const createSchedule = jest.fn();
const getSchedules = jest.fn();
const updateSchedule = jest.fn();
const deleteSchedule = jest.fn();
const MockSchedulesService = jest.fn().mockImplementation(() => {
	return {createSchedule, getSchedules, updateSchedule, deleteSchedule};
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

const timeslot = {
	name: 'schedule',
	slotsDurationInMin: 60,
	weekdaySchedules: [
		{weekday: Weekday.Monday, hasSchedule: true, openTime: '11:23', closeTime: '12:23'} as WeekDayScheduleContract
	]
} as ScheduleRequest;

describe('Test templates schedules controller', () => {
	it('should test if create service is called', async () => {
		Container.bind(SchedulesService).to(MockSchedulesService);
		const schedulesController = Container.get(SchedulesController);

		await schedulesController.createSchedule(timeslot);
		expect(createSchedule).toBeCalledTimes(1);
	});

	it('should test if get schedules service is called', async () => {
		Container.bind(SchedulesService).to(MockSchedulesService);
		const schedulesController = Container.get(SchedulesController);

		await schedulesController.getSchedules();
		expect(getSchedules).toBeCalledTimes(1);
	});

	it('should test if update service is called', async () => {
		Container.bind(SchedulesService).to(MockSchedulesService);
		const schedulesController = Container.get(SchedulesController);

		await schedulesController.updateSchedule(1, timeslot);
		expect(updateSchedule).toBeCalledTimes(1);
	});

	it('should test if delete service is called', async () => {
		Container.bind(SchedulesService).to(MockSchedulesService);
		const schedulesController = Container.get(SchedulesController);

		await schedulesController.deleteSchedule(3);
		expect(deleteSchedule).toBeCalledTimes(1);
	});

});
