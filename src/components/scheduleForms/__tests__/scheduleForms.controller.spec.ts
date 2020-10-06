import { Container } from 'typescript-ioc';
import { ScheduleFormRequest, WeekDayScheduleContract } from '../scheduleForms.apicontract';
import { ScheduleFormsService } from '../scheduleForms.service';
import { ScheduleFormsController } from '../scheduleForms.controller';
import { Weekday } from '../../../enums/weekday';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeEach(() => {
	jest.clearAllMocks();
});

jest.mock('mol-lib-common', () => {
	const actual = jest.requireActual('mol-lib-common');
	const mock = (config: any) => {
		return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => descriptor;
	};
	return {
		...actual,
		MOLAuth: mock,
	};
});

const createScheduleForm = jest.fn();
const getScheduleForms = jest.fn();
const updateScheduleForm = jest.fn();
const deleteScheduleForm = jest.fn();
const MockScheduleFormsService = jest.fn().mockImplementation(() => {
	return { createScheduleForm, getScheduleForms, updateScheduleForm, deleteScheduleForm };
});

const timeslot = {
	name: 'scheduleForm',
	slotsDurationInMin: 60,
	weekdaySchedules: [
		{
			weekday: Weekday.Monday,
			hasScheduleForm: true,
			openTime: '11:23',
			closeTime: '12:23',
		} as WeekDayScheduleContract,
	],
} as ScheduleFormRequest;

describe('Test templates scheduleForms controller', () => {
	it('should test if create service is called', async () => {
		Container.bind(ScheduleFormsService).to(MockScheduleFormsService);
		const scheduleFormsController = Container.get(ScheduleFormsController);

		await scheduleFormsController.createScheduleForm(timeslot);
		expect(createScheduleForm).toBeCalledTimes(1);
	});

	it('should test if get scheduleForms service is called', async () => {
		Container.bind(ScheduleFormsService).to(MockScheduleFormsService);
		const scheduleFormsController = Container.get(ScheduleFormsController);

		await scheduleFormsController.getScheduleForms();
		expect(getScheduleForms).toBeCalledTimes(1);
	});

	it('should test if update service is called', async () => {
		Container.bind(ScheduleFormsService).to(MockScheduleFormsService);
		const scheduleFormsController = Container.get(ScheduleFormsController);

		await scheduleFormsController.updateScheduleForm(1, timeslot);
		expect(updateScheduleForm).toBeCalledTimes(1);
	});

	it('should test if delete service is called', async () => {
		Container.bind(ScheduleFormsService).to(MockScheduleFormsService);
		const scheduleFormsController = Container.get(ScheduleFormsController);

		await scheduleFormsController.deleteScheduleForm(3);
		expect(deleteScheduleForm).toBeCalledTimes(1);
	});
});
