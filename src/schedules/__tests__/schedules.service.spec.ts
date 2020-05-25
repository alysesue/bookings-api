import SchedulesService from "../schedules.service";
import { ScheduleRequest } from "../schedules.apicontract";
import { SchedulesRepository } from "../schedules.repository";
import { Container } from "typescript-ioc";
import { Schedule } from "../../../models/Schedule";

const timeslotsRequestCommon: ScheduleRequest = new ScheduleRequest('name', '11:23', '12:23', 60, []);
const timeslotsCommon: Schedule = Schedule.mapScheduleRequest(timeslotsRequestCommon);

const getScheduleByName = jest.fn().mockImplementation(() => Promise.resolve(timeslotsCommon));
const setSchedule = jest.fn().mockImplementation(() => Promise.resolve(timeslotsCommon));
const deleteSchedule = jest.fn().mockImplementation(() => Promise.resolve(undefined));
const MockTimeslotsRepository = jest.fn().mockImplementation(() => ({
	setSchedule,
	getScheduleByName,
	deleteSchedule
}));

describe('Timeslots  template services ', () => {
	let timeslotsService: SchedulesService;
	beforeAll(() => {
		Container.bind(SchedulesRepository).to(MockTimeslotsRepository);
		timeslotsService = Container.get(SchedulesService);
	});
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should throw error because firstSlotStartTimeInHHmm have wrong format', async () => {
		const timeslotsRequest: ScheduleRequest = new ScheduleRequest('name', '2323', '11:23', 5, []);
		try {
			await timeslotsService.createSchedule(timeslotsRequest);
		} catch (e) {
			expect(e.message).toBe("Not valid format for firstSlotStartTimeInHHmm: 2323");
		}
		expect(setSchedule).toBeCalledTimes(0);
	});

	it('should throw error because lastSlotEndTimeInHHmm have wrong format', async () => {
		const timeslotsRequest: ScheduleRequest = new ScheduleRequest('name', '23:23', '11:73', 5, []);
		try {
			await timeslotsService.createSchedule(timeslotsRequest);
		} catch (e) {
			expect(e.message).toBe("Not valid format for lastSlotEndTimeInHHmm: 11:73");
		}
		expect(setSchedule).toBeCalledTimes(0);
	});

	it('should throw error because firstSlotStartTimeInHHmm > lastSlotEndTimeInHHmm', async () => {
		const timeslotsRequest: ScheduleRequest = new ScheduleRequest('name', '23:23', '11:23', 5, []);
		try {
			await timeslotsService.createSchedule(timeslotsRequest);
		} catch (e) {
			expect(e.message).toBe("firstSlotStartTimeInHHmm=23:23 > lastSlotEndTimeInHHmm=11:23");
		}
		expect(setSchedule).toBeCalledTimes(0);

	});

	it('should throw error because slotsDurationInMin < lastSlotEndTimeInHHmm - firstSlotStartTimeInHHmm ', async () => {
		const timeslotsRequest: ScheduleRequest = new ScheduleRequest('name', '11:23', '12:23', 65, []);
		try {
			await timeslotsService.createSchedule(timeslotsRequest);
		} catch (e) {
			expect(e.message).toBe("slotsDurationInMin=65 < (lastSlotEndTimeInHHmm-firstSlotStartTimeInHHmm)=60");
		}
		expect(setSchedule).toBeCalledTimes(0);

	});

	it('should create new Schedule ', async () => {
		await timeslotsService.createSchedule(timeslotsRequestCommon);
		expect(setSchedule).toBeCalledTimes(1);
	});

	it('should update the template', async () => {
		const template = await timeslotsService.updateSchedule(timeslotsRequestCommon);
		const timeslots = Schedule.mapScheduleRequest(timeslotsRequestCommon);
		expect(setSchedule).toBeCalled();
		expect(getScheduleByName).toBeCalled();
		expect(template.name).toStrictEqual(timeslots.name);
	});

	it('should call delete repository', async () => {
		await timeslotsService.deleteSchedule(3);
		expect(deleteSchedule).toBeCalled();
	});

});
