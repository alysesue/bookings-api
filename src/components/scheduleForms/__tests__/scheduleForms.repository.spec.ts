import { ScheduleFormsRepository } from '../scheduleForms.repository';
import { WeekDayBreakRepository } from '../weekdaybreak.repository';
import { Container } from 'typescript-ioc';
import { Organisation, ScheduleForm, User } from '../../../models';
import { TransactionManager } from '../../../core/transactionManager';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { AuthGroup, OrganisationAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { UserConditionParams } from '../../../infrastructure/auth/authConditionCollection';
import { UsersRepository } from '../../users/users.repository';
import { ScheduleFormsQueryAuthVisitor } from '../scheduleForms.auth';

jest.mock('../scheduleForms.auth');

describe('ScheduleForm repository', () => {
	const userMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
		agencyUserId: 'ABC12',
	});
	const organisation = new Organisation();
	organisation.id = 1;
	const queryBuilderMock: {
		delete: jest.Mock;
		from: jest.Mock;
		where: jest.Mock;
		execute: jest.Mock;
		leftJoin: jest.Mock;
		leftJoinAndSelect: jest.Mock;
		getMany: jest.Mock<Promise<ScheduleForm[]>, any>;
		getOne: jest.Mock<Promise<ScheduleForm>, any>;
	} = {
		delete: jest.fn(),
		from: jest.fn(),
		execute: jest.fn(),
		where: jest.fn(),
		leftJoin: jest.fn(),
		leftJoinAndSelect: jest.fn(),
		getMany: jest.fn<Promise<ScheduleForm[]>, any>(),
		getOne: jest.fn<Promise<ScheduleForm>, any>(),
	};

	const scheduleForm = new ScheduleForm();
	scheduleForm.initWeekdaySchedules();
	scheduleForm.id = 2;

	const QueryAuthVisitorMock = {
		createUserVisibilityCondition: jest.fn<Promise<UserConditionParams>, any>(),
	};

	afterAll(() => {
		jest.resetAllMocks();
		if (global.gc) global.gc();
	});

	beforeAll(() => {
		Container.bind(TransactionManager).to(TransactionManagerMock);
		Container.bind(WeekDayBreakRepository).to(WeekDayBreakRepositoryMock);
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(UsersRepository).to(UsersRepositoryMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();

		queryBuilderMock.delete.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.from.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.where.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.leftJoin.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.leftJoinAndSelect.mockImplementation(() => queryBuilderMock);

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		(ScheduleFormsQueryAuthVisitor as jest.Mock).mockImplementation(() => QueryAuthVisitorMock);
		QueryAuthVisitorMock.createUserVisibilityCondition.mockImplementation(() =>
			Promise.resolve({ userCondition: '', userParams: {} }),
		);

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(userMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(userMock, [organisation])]),
		);

		UsersRepositoryMock.getUsersByMolAdminIds.mockImplementation(() => Promise.resolve([]));
	});

	it('should get schedules form', async () => {
		queryBuilderMock.getMany.mockImplementation(() => Promise.resolve([]));
		const repository = Container.get(ScheduleFormsRepository);
		const result = await repository.getScheduleForms();
		expect(result).not.toBe(undefined);

		expect(queryBuilderMock.getMany).toBeCalledTimes(1);
	});

	it('should get schedules form with id', async () => {
		queryBuilderMock.getOne.mockImplementation(() => Promise.resolve(scheduleForm));
		const repository = Container.get(ScheduleFormsRepository);
		const result = await repository.getScheduleFormById(1);
		expect(result).not.toBe(undefined);

		expect(queryBuilderMock.getOne).toBeCalledTimes(1);
	});

	it('should return null when schedule form not found', async () => {
		const repository = Container.get(ScheduleFormsRepository);

		const result = await repository.getScheduleFormById(1);
		expect(result).toBe(null);

		expect(queryBuilderMock.getOne).toBeCalledTimes(1);
	});

	it('should add schedules form', async () => {
		TransactionManagerMock.save.mockImplementation(() => scheduleForm);
		WeekDayBreakRepositoryMock.save.mockImplementation(() => Promise.resolve([]));

		const repository = Container.get(ScheduleFormsRepository);
		const result = await repository.saveScheduleForm(scheduleForm);
		expect(result).not.toBe(undefined);

		expect(TransactionManagerMock.save).toBeCalledTimes(1);
	});

	it('should remove schedules form', async () => {
		TransactionManagerMock.delete.mockImplementation(() => 1);
		WeekDayBreakRepositoryMock.deleteBreaksForSchedule.mockImplementation(() => Promise.resolve());
		queryBuilderMock.execute.mockImplementation(() => Promise.resolve());

		const repository = Container.get(ScheduleFormsRepository);
		const result = await repository.deleteScheduleForm(34848);
		expect(result).not.toBe(undefined);

		expect(WeekDayBreakRepositoryMock.deleteBreaksForSchedule).toBeCalled();
		expect(queryBuilderMock.execute).toBeCalled();
		expect(TransactionManagerMock.delete).toBeCalledTimes(1);
	});
});

class WeekDayBreakRepositoryMock extends WeekDayBreakRepository {
	public static getBreaksForSchedules = jest.fn();
	public static deleteBreaksForSchedule = jest.fn();
	public static save = jest.fn();

	public async getBreaksForSchedules(...params): Promise<any> {
		return await WeekDayBreakRepositoryMock.getBreaksForSchedules(...params);
	}

	public async deleteBreaksForSchedule(...params): Promise<any> {
		return await WeekDayBreakRepositoryMock.deleteBreaksForSchedule(...params);
	}

	public async save(...params): Promise<any> {
		return await WeekDayBreakRepositoryMock.save(...params);
	}
}

const scheduleFormMock = new ScheduleForm();
scheduleFormMock.id = 1;
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

class UserContextMock extends UserContext {
	public static getCurrentUser = jest.fn<Promise<User>, any>();
	public static getAuthGroups = jest.fn<Promise<AuthGroup[]>, any>();

	public init() {}
	public async getCurrentUser(...params): Promise<any> {
		return await UserContextMock.getCurrentUser(...params);
	}

	public async getAuthGroups(...params): Promise<any> {
		return await UserContextMock.getAuthGroups(...params);
	}
}

class UsersRepositoryMock extends UsersRepository {
	public static getUsersByMolAdminIds = jest.fn<Promise<User[]>, any>();

	public async getUsersByMolAdminIds(...params): Promise<any> {
		return await UsersRepositoryMock.getUsersByMolAdminIds(...params);
	}
}
