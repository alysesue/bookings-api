import { ScheduleFormsRepository } from '../scheduleForms.repository';
import { WeekDayBreakRepository } from '../weekdaybreak.repository';
import { Container } from 'typescript-ioc';
import { ScheduleForm, Service, User } from '../../../models';
import { TransactionManager } from '../../../core/transactionManager';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../bookings/__tests__/bookings.mocks';
import { ServiceAdminAuthGroup } from '../../../infrastructure/auth/authGroup';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
	Container.bind(WeekDayBreakRepository).to(jest.fn(() => WeekDayBreakRepositoryMock));
	Container.bind(UserContext).to(UserContextMock);
});

beforeEach(() => {
	jest.clearAllMocks();
});

const NullScheduleId = 55;

const serviceMockWithTemplate = new Service();
serviceMockWithTemplate.id = 1;
const adminMock = User.createAdminUser({
	molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
	userName: 'UserName',
	email: 'test@email.com',
	name: 'Name',
});
describe('ScheduleForm repository', () => {
	it('should get schedules form', async () => {
		const scheduleForm = new ScheduleForm();
		scheduleForm.id = 2;
		scheduleForm.initWeekdaySchedules();

		UserContextMock.getAuthGroups.mockReturnValue(
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [serviceMockWithTemplate])]),
		);
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([scheduleForm])),
		};

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(ScheduleFormsRepository);
		const result = await repository.getScheduleForms();
		expect(result).not.toBe(undefined);

		expect(queryBuilderMock.getMany).toBeCalledTimes(1);
	});

	it('should get schedules form with id', async () => {
		UserContextMock.getAuthGroups.mockReturnValue(
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [serviceMockWithTemplate])]),
		);
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve(null)),
		};

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(ScheduleFormsRepository);
		const result = await repository.getScheduleFormById(1);
		expect(result).not.toBe(undefined);

		expect(queryBuilderMock.getOne).toBeCalledTimes(1);
	});

	it('should return null when schedule form not found', async () => {
		const repository = Container.get(ScheduleFormsRepository);
		UserContextMock.getAuthGroups.mockReturnValue(
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [serviceMockWithTemplate])]),
		);
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve(null)),
		};

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const result = await repository.getScheduleFormById(NullScheduleId);
		expect(result).toBe(null);

		expect(queryBuilderMock.getOne).toBeCalledTimes(1);
	});

	it('should add schedules form', async () => {
		const scheduleForm = new ScheduleForm();
		scheduleForm.id = 2;
		scheduleForm.initWeekdaySchedules();
		TransactionManagerMock.save.mockImplementation(() => scheduleForm);

		const repository = Container.get(ScheduleFormsRepository);
		const result = await repository.saveScheduleForm(scheduleForm);
		expect(result).not.toBe(undefined);

		expect(TransactionManagerMock.save).toBeCalledTimes(1);
	});

	it('should remove schedules form', async () => {
		TransactionManagerMock.delete.mockImplementation(() => 1);
		const repository = Container.get(ScheduleFormsRepository);
		const result = await repository.deleteScheduleForm(34848);
		expect(result).not.toBe(undefined);

		expect(TransactionManagerMock.delete).toBeCalledTimes(1);
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

class TransactionManagerMock extends TransactionManager {
	public static insert = jest.fn();
	public static find = jest.fn();
	public static update = jest.fn();
	public static findOne = jest.fn();
	public static getOne = jest.fn();
	public static getMany = jest.fn();
	public static save = jest.fn();
	public static query = jest.fn();
	public static delete = jest.fn();
	public static createQueryBuilder = jest.fn();

	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: () => ({
				find: TransactionManagerMock.find,
				findOne: TransactionManagerMock.findOne,
				getOne: TransactionManagerMock.getOne,
				getMany: TransactionManagerMock.getMany,
				insert: TransactionManagerMock.insert,
				update: TransactionManagerMock.update,
				save: TransactionManagerMock.save,
				query: TransactionManagerMock.query,
				delete: TransactionManagerMock.delete,
				createQueryBuilder: TransactionManagerMock.createQueryBuilder,
			}),
		};
		return Promise.resolve(entityManager);
	}
}
