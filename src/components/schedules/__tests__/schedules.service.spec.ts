import { SchedulesService } from '../schedules.service';
import { ScheduleRequest, WeekDayBreakContract, WeekDayScheduleContract } from '../schedules.apicontract';
import { SchedulesRepository } from '../schedules.repository';
import { Container } from 'typescript-ioc';
import { Schedule } from '../../../models';
import { mapToEntity } from '../schedules.mapper';
import { Weekday } from '../../../enums/weekday';
import { MOLErrorV2 } from 'mol-lib-api-contract';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

const scheduleRequestCommon = {
	name: 'schedule',
	slotsDurationInMin: 60,
	weekdaySchedules: [
		{
			weekday: Weekday.Monday,
			hasSchedule: true,
			openTime: '8:30',
			closeTime: '12:30',
			breaks: [{ startTime: '11:00', endTime: '11:30' } as WeekDayBreakContract],
		} as WeekDayScheduleContract,
	],
} as ScheduleRequest;

const scheduleCommon = new Schedule();
mapToEntity(scheduleRequestCommon, scheduleCommon);

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
	deleteSchedule,
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

	it('should throw error because open and close times have wrong format', async () => {
		const schedulesRequest: ScheduleRequest = {
			name: 'schedule',
			slotsDurationInMin: 5,
			weekdaySchedules: [
				{
					weekday: Weekday.Monday,
					hasSchedule: true,
					openTime: '2323',
					closeTime: '25:25',
				} as WeekDayScheduleContract,
			],
		} as ScheduleRequest;

		try {
			await schedulesService.createSchedule(schedulesRequest);
		} catch (e) {
			expect(e.message).toBe('Invalid request parameters.');
			expect((e as MOLErrorV2).responseData).toMatchSnapshot();
		}
		expect(saveSchedule).toBeCalledTimes(0);
	});

	it('should throw error because close time have wrong format', async () => {
		const schedulesRequest: ScheduleRequest = {
			name: 'schedule',
			slotsDurationInMin: 5,
			weekdaySchedules: [
				{
					weekday: Weekday.Monday,
					hasSchedule: true,
					openTime: '23:23',
					closeTime: '11:73',
				} as WeekDayScheduleContract,
			],
		} as ScheduleRequest;

		try {
			await schedulesService.createSchedule(schedulesRequest);
		} catch (e) {
			expect(e.message).toBe('Invalid request parameters.');
			expect((e as MOLErrorV2).responseData).toMatchSnapshot();
		}
		expect(saveSchedule).toBeCalledTimes(0);
	});

	it('should throw error because openTime > closeTime', async () => {
		const schedulesRequest: ScheduleRequest = {
			name: 'schedule',
			slotsDurationInMin: 5,
			weekdaySchedules: [
				{
					weekday: Weekday.Monday,
					hasSchedule: true,
					openTime: '23:23',
					closeTime: '11:23',
				} as WeekDayScheduleContract,
			],
		} as ScheduleRequest;

		try {
			await schedulesService.createSchedule(schedulesRequest);
		} catch (e) {
			expect(e.message).toBe('Invalid request parameters.');
			expect((e as MOLErrorV2).responseData).toMatchSnapshot();
		}
		expect(saveSchedule).toBeCalledTimes(0);
	});

	it('should throw error because slotsDurationInMin < (closeTime - openTime)', async () => {
		const schedulesRequest: ScheduleRequest = {
			name: 'schedule',
			slotsDurationInMin: 65,
			weekdaySchedules: [
				{
					weekday: Weekday.Monday,
					hasSchedule: true,
					openTime: '11:23',
					closeTime: '12:23',
				} as WeekDayScheduleContract,
			],
		} as ScheduleRequest;

		try {
			await schedulesService.createSchedule(schedulesRequest);
		} catch (e) {
			expect(e.message).toBe('Invalid request parameters.');
			expect((e as MOLErrorV2).responseData).toMatchSnapshot();
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
		expect(getScheduleById).toBeCalled();
		expect(template.name).toStrictEqual(scheduleRequestCommon.name);
	});

	it('should get schedules', async () => {
		await schedulesService.getSchedules();
		expect(getSchedules).toBeCalled();
	});

	it('should call delete repository', async () => {
		await schedulesService.deleteSchedule(3);
		expect(deleteSchedule).toBeCalled();
	});
});
