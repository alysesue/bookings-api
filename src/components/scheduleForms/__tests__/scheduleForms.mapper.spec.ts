import { ScheduleFormRequest, WeekDayScheduleContract } from '../scheduleForms.apicontract';
import { ScheduleForm, TimeOfDay, WeekDayBreak, WeekDaySchedule } from '../../../models';
import { ScheduleFormsMapper } from '../scheduleForms.mapper';
import { Weekday } from '../../../enums/weekday';
import { Container } from 'typescript-ioc';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('schedule mapper tests', () => {
	beforeAll(() => {
		Container.bind(IdHasher).to(IdHasherMock);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	const scheduleForm = new ScheduleForm();
	scheduleForm.id = 1;
	scheduleForm.slotsDurationInMin = 60;
	const weekdaySchedule = WeekDaySchedule.create(Weekday.Monday, scheduleForm);
	weekdaySchedule.hasScheduleForm = true;
	weekdaySchedule.openTime = TimeOfDay.create({ hours: 8, minutes: 5 });
	weekdaySchedule.closeTime = TimeOfDay.create({ hours: 8, minutes: 30 });
	const weekDayBreak = new WeekDayBreak();
	weekDayBreak.startTime = TimeOfDay.create({ hours: 8, minutes: 10 });
	weekDayBreak.endTime = TimeOfDay.create({ hours: 8, minutes: 30 });
	weekdaySchedule.breaks = [weekDayBreak];
	scheduleForm.weekdaySchedules = [weekdaySchedule];

	it('should throw error because open and close times have wrong format', async () => {
		const scheduleFormsRequest: ScheduleFormRequest = {
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

		const scheduleFormsMapper = Container.get(ScheduleFormsMapper);
		const result = scheduleFormsMapper.mapToEntity(scheduleFormsRequest, new ScheduleForm());
		expect(result).toStrictEqual({
			errorResult: ['Value 2323 is not a valid time.', 'Value 25:25 is not a valid time.'],
		});
	});

	it('should throw error because close time have wrong format', async () => {
		const scheduleFormsRequest: ScheduleFormRequest = {
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

		const scheduleFormsMapper = Container.get(ScheduleFormsMapper);
		const result = scheduleFormsMapper.mapToEntity(scheduleFormsRequest, new ScheduleForm());
		expect(result).toStrictEqual({
			errorResult: ['Value 11:73 is not a valid time.'],
		});
	});

	it('should map day schedule correctly with capacity value set', async () => {
		const scheduleFormsRequest: ScheduleFormRequest = {
			slotsDurationInMin: 5,
			weekdaySchedules: [
				{
					weekday: Weekday.Monday,
					hasScheduleForm: true,
					openTime: '23:23',
					closeTime: '11:23',
					capacity: 2,
				} as WeekDayScheduleContract,
			],
		} as ScheduleFormRequest;

		const scheduleFormsMapper = Container.get(ScheduleFormsMapper);
		const result = scheduleFormsMapper.mapToEntity(scheduleFormsRequest, new ScheduleForm());
		if (result instanceof ScheduleForm) {
			expect(result.weekdaySchedules[0].capacity).toEqual(2);
		}
	});

	it('should map day schedule correctly with schedule start and end date', async () => {
		const scheduleFormsRequest: ScheduleFormRequest = {
			slotsDurationInMin: 5,
			startDate: new Date('2021-06-07'),
			endDate: new Date('2021-06-08'),
			weekdaySchedules: [
				{
					weekday: Weekday.Monday,
					hasScheduleForm: true,
					openTime: '23:23',
					closeTime: '11:23',
					capacity: 2,
				} as WeekDayScheduleContract,
			],
		} as ScheduleFormRequest;

		const scheduleFormsMapper = Container.get(ScheduleFormsMapper);
		const result = scheduleFormsMapper.mapToEntity(scheduleFormsRequest, new ScheduleForm());
		if (result instanceof ScheduleForm) {
			expect(result.startDate).toEqual(new Date('2021-06-07'));
			expect(result.endDate).toEqual(new Date('2021-06-08'));
		}
	});

	it('should map to response V1', async () => {
		const scheduleFormsMapper = Container.get(ScheduleFormsMapper);
		const result = scheduleFormsMapper.mapToResponseV1(scheduleForm);
		expect(result).toEqual({
			id: 1,
			slotsDurationInMin: 60,
			weekdaySchedules: [
				{
					breaks: [
						{
							endTime: '08:30',
							startTime: '08:10',
						},
					],
					closeTime: '08:30',
					hasScheduleForm: true,
					openTime: '08:05',
					weekday: 1,
				},
			],
		});
	});

	it('should map to response V2', async () => {
		IdHasherMock.encode.mockImplementation((id: number) => String(id));

		const scheduleFormsMapper = Container.get(ScheduleFormsMapper);
		const result = scheduleFormsMapper.mapToResponseV2(scheduleForm);
		expect(result).toEqual({
			id: '1',
			slotsDurationInMin: 60,
			weekdaySchedules: [
				{
					breaks: [
						{
							endTime: '08:30',
							startTime: '08:10',
						},
					],
					closeTime: '08:30',
					hasScheduleForm: true,
					openTime: '08:05',
					weekday: 1,
				},
			],
		});
	});
});
