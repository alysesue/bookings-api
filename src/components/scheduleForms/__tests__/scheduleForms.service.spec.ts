import { ScheduleFormsService } from '../scheduleForms.service';
import { ScheduleFormRequest, WeekDayBreakContract, WeekDayScheduleContract } from '../scheduleForms.apicontract';
import { ScheduleFormsRepository } from '../scheduleForms.repository';
import { Container } from 'typescript-ioc';
import { ScheduleForm } from '../../../models';
import { mapToEntity } from '../scheduleForms.mapper';
import { Weekday } from '../../../enums/weekday';
import { MOLErrorV2 } from 'mol-lib-api-contract';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

const ScheduleFormRequestCommon = {
	name: 'schedule',
	slotsDurationInMin: 60,
	weekdaySchedules: [
		{
			weekday: Weekday.Monday,
			hasScheduleForm: true,
			openTime: '8:30',
			closeTime: '12:30',
			breaks: [{ startTime: '11:00', endTime: '11:30' } as WeekDayBreakContract],
		} as WeekDayScheduleContract,
	],
} as ScheduleFormRequest;

const scheduleCommon = new ScheduleForm();
mapToEntity(ScheduleFormRequestCommon, scheduleCommon);

const getScheduleForms = jest.fn().mockImplementation(() => Promise.resolve([scheduleCommon]));
const getScheduleFormById = jest.fn().mockImplementation(() => Promise.resolve(scheduleCommon));
const getScheduleFormByName = jest.fn().mockImplementation(() => Promise.resolve(scheduleCommon));
const saveScheduleForm = jest.fn().mockImplementation(() => Promise.resolve(scheduleCommon));
const deleteScheduleForm = jest.fn().mockImplementation(() => Promise.resolve(undefined));
const MockScheduleFormsRepository = jest.fn().mockImplementation(() => ({
	getScheduleForms,
	saveScheduleForm,
	getScheduleFormById,
	getScheduleFormByName,
	deleteScheduleForm,
}));

describe('Schedules form template services ', () => {
	let scheduleFormsService: ScheduleFormsService;
	beforeAll(() => {
		Container.bind(ScheduleFormsRepository).to(MockScheduleFormsRepository);
		scheduleFormsService = Container.get(ScheduleFormsService);
	});
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should throw error because open and close times have wrong format', async () => {
		const scheduleFormsRequest: ScheduleFormRequest = {
			name: 'schedule',
			slotsDurationInMin: 5,
			weekdaySchedules: [
				{
					weekday: Weekday.Monday,
					hasScheduleForm: true,
					openTime: '2323',
					closeTime: '25:25',
				} as WeekDayScheduleContract,
			],
		} as ScheduleFormRequest;

		try {
			await scheduleFormsService.createScheduleForm(scheduleFormsRequest);
		} catch (e) {
			expect(e.message).toBe('Invalid request parameters.');
			expect((e as MOLErrorV2).responseData).toMatchSnapshot();
		}
		expect(saveScheduleForm).toBeCalledTimes(0);
	});

	it('should throw error because close time have wrong format', async () => {
		const scheduleFormsRequest: ScheduleFormRequest = {
			name: 'schedule',
			slotsDurationInMin: 5,
			weekdaySchedules: [
				{
					weekday: Weekday.Monday,
					hasScheduleForm: true,
					openTime: '23:23',
					closeTime: '11:73',
				} as WeekDayScheduleContract,
			],
		} as ScheduleFormRequest;

		try {
			await scheduleFormsService.createScheduleForm(scheduleFormsRequest);
		} catch (e) {
			expect(e.message).toBe('Invalid request parameters.');
			expect((e as MOLErrorV2).responseData).toMatchSnapshot();
		}
		expect(saveScheduleForm).toBeCalledTimes(0);
	});

	it('should throw error because openTime > closeTime', async () => {
		const scheduleFormsRequest: ScheduleFormRequest = {
			name: 'schedule',
			slotsDurationInMin: 5,
			weekdaySchedules: [
				{
					weekday: Weekday.Monday,
					hasScheduleForm: true,
					openTime: '23:23',
					closeTime: '11:23',
				} as WeekDayScheduleContract,
			],
		} as ScheduleFormRequest;

		try {
			await scheduleFormsService.createScheduleForm(scheduleFormsRequest);
		} catch (e) {
			expect(e.message).toBe('Invalid request parameters.');
			expect((e as MOLErrorV2).responseData).toMatchSnapshot();
		}
		expect(saveScheduleForm).toBeCalledTimes(0);
	});

	it('should throw error because slotsDurationInMin < (closeTime - openTime)', async () => {
		const scheduleFormsRequest: ScheduleFormRequest = {
			name: 'schedule',
			slotsDurationInMin: 65,
			weekdaySchedules: [
				{
					weekday: Weekday.Monday,
					hasScheduleForm: true,
					openTime: '11:23',
					closeTime: '12:23',
				} as WeekDayScheduleContract,
			],
		} as ScheduleFormRequest;

		try {
			await scheduleFormsService.createScheduleForm(scheduleFormsRequest);
		} catch (e) {
			expect(e.message).toBe('Invalid request parameters.');
			expect((e as MOLErrorV2).responseData).toMatchSnapshot();
		}
		expect(saveScheduleForm).toBeCalledTimes(0);
	});

	it('should create new Schedule ', async () => {
		await scheduleFormsService.createScheduleForm(ScheduleFormRequestCommon);
		expect(saveScheduleForm).toBeCalledTimes(1);
	});

	it('should update the template', async () => {
		const template = await scheduleFormsService.updateScheduleForm(1, ScheduleFormRequestCommon);

		expect(saveScheduleForm).toBeCalled();
		expect(getScheduleFormById).toBeCalled();
		expect(template.name).toStrictEqual(ScheduleFormRequestCommon.name);
	});

	it('should get scheduleForms', async () => {
		await scheduleFormsService.getScheduleForms();
		expect(getScheduleForms).toBeCalled();
	});

	it('should call delete repository', async () => {
		await scheduleFormsService.deleteScheduleForm(3);
		expect(deleteScheduleForm).toBeCalled();
	});
});