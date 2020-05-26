import { SchedulesService } from "../schedules.service";
import { ScheduleRequest, WeekDayScheduleContract } from "../schedules.apicontract";
import { SchedulesRepository } from "../schedules.repository";
import { Container } from "typescript-ioc";
import { Schedule } from "../../models/Schedule";
import { mapToEntity } from '../schedules.mapper';
import { Weekday } from "../../enums/weekday";

const scheduleRequestCommon = {
	name: 'schedule',
	slotsDurationInMin: 60,
	weekdaySchedules: [
		{ weekday: Weekday.Monday, hasSchedule: true, openTime: '11:23', closeTime: '12:23' } as WeekDayScheduleContract
	]
} as ScheduleRequest;

const scheduleCommon: Schedule = mapToEntity(scheduleRequestCommon, new Schedule());

const getSchedules = jest.fn().mockImplementation(() => Promise.resolve([scheduleCommon]));
const getScheduleById = jest.fn().mockImplementation(() => Promise.resolve(scheduleCommon));
const getScheduleByName = jest.fn().mockImplementation(() => Promise.resolve(scheduleCommon));
const saveSchedule = jest.fn().mockImplementation(() => Promise.resolve(scheduleCommon));
const deleteSchedule = jest.fn().mockImplementation(() => Promise.resolve(undefined));
const MockSchedulesRepository = jest.fn().mockImplementation(() => ({
	getSchedules,
	saveSchedule,
	getScheduleById,
	getScheduleByName,
	deleteSchedule
}));

describe('Schedules  template services ', () => {
	let schedulesService: SchedulesService;
	beforeAll(() => {
		Container.bind(SchedulesRepository).to(MockSchedulesRepository);
		schedulesService = Container.get(SchedulesService);
	});
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should throw error because firstSlotStartTimeInHHmm have wrong format', async () => {
		const schedulesRequest: ScheduleRequest = {
			name: 'schedule',
			slotsDurationInMin: 5,
			weekdaySchedules: [
				{ weekday: Weekday.Monday, hasSchedule: true, openTime: '2323', closeTime: '12:23' } as WeekDayScheduleContract
			]
		} as ScheduleRequest;

		try {
			await schedulesService.createSchedule(schedulesRequest);
		} catch (e) {
			expect(e.message).toBe("Not valid format for firstSlotStartTimeInHHmm: 2323");
		}
		expect(saveSchedule).toBeCalledTimes(0);
	});

	it('should throw error because lastSlotEndTimeInHHmm have wrong format', async () => {
		const schedulesRequest: ScheduleRequest = {
			name: 'schedule',
			slotsDurationInMin: 5,
			weekdaySchedules: [
				{ weekday: Weekday.Monday, hasSchedule: true, openTime: '23:23', closeTime: '11:73' } as WeekDayScheduleContract
			]
		} as ScheduleRequest;

		try {
			await schedulesService.createSchedule(schedulesRequest);
		} catch (e) {
			expect(e.message).toBe("Not valid format for lastSlotEndTimeInHHmm: 11:73");
		}
		expect(saveSchedule).toBeCalledTimes(0);
	});

	it('should throw error because firstSlotStartTimeInHHmm > lastSlotEndTimeInHHmm', async () => {
		const schedulesRequest: ScheduleRequest = {
			name: 'schedule',
			slotsDurationInMin: 5,
			weekdaySchedules: [
				{ weekday: Weekday.Monday, hasSchedule: true, openTime: '23:23', closeTime: '11:23' } as WeekDayScheduleContract
			]
		} as ScheduleRequest;

		try {
			await schedulesService.createSchedule(schedulesRequest);
		} catch (e) {
			expect(e.message).toBe("firstSlotStartTimeInHHmm=23:23 > lastSlotEndTimeInHHmm=11:23");
		}
		expect(saveSchedule).toBeCalledTimes(0);

	});

	it('should throw error because slotsDurationInMin < lastSlotEndTimeInHHmm - firstSlotStartTimeInHHmm ', async () => {
		const schedulesRequest: ScheduleRequest = {
			name: 'schedule',
			slotsDurationInMin: 65,
			weekdaySchedules: [
				{ weekday: Weekday.Monday, hasSchedule: true, openTime: '11:23', closeTime: '12:23' } as WeekDayScheduleContract
			]
		} as ScheduleRequest;

		try {
			await schedulesService.createSchedule(schedulesRequest);
		} catch (e) {
			expect(e.message).toBe("slotsDurationInMin=65 < (lastSlotEndTimeInHHmm-firstSlotStartTimeInHHmm)=60");
		}
		expect(saveSchedule).toBeCalledTimes(0);

	});

	it('should create new Schedule ', async () => {
		await schedulesService.createSchedule(scheduleRequestCommon);
		expect(saveSchedule).toBeCalledTimes(1);
	});

	it('should update the template', async () => {
		const template = await schedulesService.updateSchedule(1, scheduleRequestCommon);

		expect(saveSchedule).toBeCalled();
		expect(getScheduleByName).toBeCalled();
		expect(template.name).toStrictEqual(scheduleRequestCommon.name);
	});

	it('should call delete repository', async () => {
		await schedulesService.deleteSchedule(3);
		expect(deleteSchedule).toBeCalled();
	});

});
