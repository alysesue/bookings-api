import { ScheduleFormRequest, WeekDayScheduleContract } from '../scheduleForms.apicontract';
import { ScheduleForm } from '../../../models';
import { mapToEntity } from '../scheduleForms.mapper';
import { Weekday } from '../../../enums/weekday';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

// tslint:disable-next-line
describe('schedule mapper tests', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

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

		const result = mapToEntity(scheduleFormsRequest, new ScheduleForm());
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

		const result = mapToEntity(scheduleFormsRequest, new ScheduleForm());
		expect(result).toStrictEqual({
			errorResult: ['Value 11:73 is not a valid time.'],
		});
	});
});
