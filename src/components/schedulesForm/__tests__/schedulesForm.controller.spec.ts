import { Container } from 'typescript-ioc';
import { ScheduleFormRequest, WeekDayScheduleContract } from '../schedulesForm.apicontract';
import { SchedulesFormService } from '../schedulesForm.service';
import { SchedulesFormController } from '../schedulesForm.controller';
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
const getSchedulesForm = jest.fn();
const updateScheduleForm = jest.fn();
const deleteScheduleForm = jest.fn();
const MockSchedulesFormService = jest.fn().mockImplementation(() => {
	return { createScheduleForm, getSchedulesForm, updateScheduleForm, deleteScheduleForm };
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
		Container.bind(SchedulesFormService).to(MockSchedulesFormService);
		const schedulesFormController = Container.get(SchedulesFormController);

		await schedulesFormController.createScheduleForm(timeslot);
		expect(createScheduleForm).toBeCalledTimes(1);
	});

	it('should test if get schedulesForm service is called', async () => {
		Container.bind(SchedulesFormService).to(MockSchedulesFormService);
		const schedulesFormController = Container.get(SchedulesFormController);

		await schedulesFormController.getSchedulesForm();
		expect(getSchedulesForm).toBeCalledTimes(1);
	});

	it('should test if update service is called', async () => {
		Container.bind(SchedulesFormService).to(MockSchedulesFormService);
		const schedulesFormController = Container.get(SchedulesFormController);

		await schedulesFormController.updateScheduleForm(1, timeslot);
		expect(updateScheduleForm).toBeCalledTimes(1);
	});

	it('should test if delete service is called', async () => {
		Container.bind(SchedulesFormService).to(MockSchedulesFormService);
		const schedulesFormController = Container.get(SchedulesFormController);

		await schedulesFormController.deleteScheduleForm(3);
		expect(deleteScheduleForm).toBeCalledTimes(1);
	});
});
