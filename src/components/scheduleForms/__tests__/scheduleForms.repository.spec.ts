import { ScheduleFormsRepository } from '../scheduleForms.repository';
import { WeekDayBreakRepository } from '../weekdaybreak.repository';
import { Container } from 'typescript-ioc';
import { ScheduleForm } from '../../../models';
import { TransactionManager } from '../../../core/transactionManager';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
	Container.bind(WeekDayBreakRepository).to(jest.fn(() => WeekDayBreakRepositoryMock));
});

beforeEach(() => {
	jest.clearAllMocks();
});

const NullScheduleId = 55;
describe('ScheduleForm repository', () => {
	it('should get schedules form', async () => {
		const repository = Container.get(ScheduleFormsRepository);
		const result = await repository.getScheduleForms();
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.find).toBeCalledTimes(1);
	});

	it('should get schedules form with id', async () => {
		const repository = Container.get(ScheduleFormsRepository);
		const result = await repository.getScheduleFormById(1);
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.findOne).toBeCalledTimes(1);
	});

	it('should return null when schedule form not found', async () => {
		const repository = Container.get(ScheduleFormsRepository);
		const result = await repository.getScheduleFormById(NullScheduleId);
		expect(result).toBe(null);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.findOne).toBeCalledTimes(1);
	});

	it('should get schedules form with name', async () => {
		const repository = Container.get(ScheduleFormsRepository);
		const result = await repository.getScheduleFormByName('test');
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.findOne).toBeCalledTimes(1);
	});

	it('should add schedules form', async () => {
		const scheduleForm = new ScheduleForm();
		scheduleForm.id = 2;
		scheduleForm.initWeekdaySchedules();

		const repository = Container.get(ScheduleFormsRepository);
		const result = await repository.saveScheduleForm(scheduleForm);
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.save).toBeCalledTimes(1);
	});

	it('should remove schedules form', async () => {
		const repository = Container.get(ScheduleFormsRepository);
		const result = await repository.deleteScheduleForm(34848);
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.delete).toBeCalledTimes(1);
	});
});

const WeekDayBreakRepositoryMock = {
	getBreaksForSchedules: jest.fn(() => Promise.resolve([])),
	deleteBreaksForSchedule: jest.fn(() => Promise.resolve({})),
	save: jest.fn(() => Promise.resolve([])),
};

const scheduleFormMock = new ScheduleForm();
scheduleFormMock.id = 1;
scheduleFormMock.name = 'test';
scheduleFormMock.initWeekdaySchedules();

export const InnerRepositoryMock = {
	findOne: jest.fn().mockImplementation((...params) => {
		if (params.length === 2 && params[0] === NullScheduleId) {
			return Promise.resolve(null);
		}

		return Promise.resolve(scheduleFormMock);
	}),
	find: jest.fn().mockImplementation(() => Promise.resolve([scheduleFormMock])),
	save: jest.fn().mockImplementation(() => Promise.resolve(scheduleFormMock)),
	delete: jest.fn().mockImplementation(() => Promise.resolve({})),
};

export const GetRepositoryMock = jest.fn().mockImplementation(() => InnerRepositoryMock);

class TransactionManagerMock extends TransactionManager {
	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: GetRepositoryMock,
		};
		return Promise.resolve(entityManager);
	}
}
