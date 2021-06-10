import { Container } from 'typescript-ioc';
import { Organisation, TimeOfDay, TimeslotItem, User } from '../../../models';
import { TimeslotItemsRepository, TimeslotItemsSearchRequest } from '../timeslotItems.repository';
import { TransactionManager } from '../../../core/transactionManager';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { AuthGroup, OrganisationAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { TimeslotItemsQueryAuthVisitor } from '../timeslotItems.auth';
import { UserConditionParams } from '../../../infrastructure/auth/authConditionCollection';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';

jest.mock('../timeslotItems.auth');

const QueryAuthVisitorMock = {
	createUserVisibilityCondition: jest.fn<Promise<UserConditionParams>, any>(),
};

const adminUserMock = User.createAdminUser({
	molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
	userName: 'UserName',
	email: 'test@email.com',
	name: 'Name',
	agencyUserId: 'ABC123',
});

const timeslotItemMock = TimeslotItem.create(
	1,
	1,
	TimeOfDay.create({ hours: 8, minutes: 0 }),
	TimeOfDay.create({ hours: 9, minutes: 0 }),
);

const organisation = new Organisation();
organisation.id = 1;

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
	Container.bind(UserContext).to(UserContextMock);
});

beforeEach(() => {
	jest.resetAllMocks();

	(TimeslotItemsQueryAuthVisitor as jest.Mock).mockImplementation(() => QueryAuthVisitorMock);
	QueryAuthVisitorMock.createUserVisibilityCondition.mockImplementation(() =>
		Promise.resolve({ userCondition: '', userParams: {} }),
	);

	UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminUserMock));
	UserContextMock.getAuthGroups.mockImplementation(() =>
		Promise.resolve([new OrganisationAdminAuthGroup(adminUserMock, [organisation])]),
	);
});

describe('TimeslotItems repository', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should save TimeslotItem', async () => {
		TransactionManagerMock.save.mockImplementation(() => Promise.resolve(timeslotItemMock));
		const repository = Container.get(TimeslotItemsRepository);
		const result = await repository.saveTimeslotItem(timeslotItemMock);
		expect(result).toStrictEqual(timeslotItemMock);
		expect(TransactionManagerMock.save).toBeCalledTimes(1);
	});

	it('should save TimeslotItems', async () => {
		TransactionManagerMock.save.mockImplementation(() => Promise.resolve(timeslotItemMock));
		const repository = Container.get(TimeslotItemsRepository);
		const result = await repository.saveTimeslotItems([timeslotItemMock]);
		expect(result).toStrictEqual(timeslotItemMock);
		expect(TransactionManagerMock.save).toBeCalledTimes(1);
	});

	it('should delete timeslot', async () => {
		const repository = Container.get(TimeslotItemsRepository);
		await repository.deleteTimeslotItem(1);
		expect(TransactionManagerMock.delete).toBeCalledTimes(1);
	});

	it('should get timeslot item', async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoin: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve(timeslotItemMock)),
		};

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const request = { id: 1, byPassAuth: false } as TimeslotItemsSearchRequest;
		const repository = Container.get(TimeslotItemsRepository);
		const timeslot = await repository.getTimeslotItem(request);

		expect(timeslot).toStrictEqual(timeslotItemMock);
	});

	it('should delete timeslots for Schedule', async () => {
		const queryBuilderMock = {
			delete: jest.fn(() => queryBuilderMock),
			from: jest.fn(() => queryBuilderMock),
			where: jest.fn(() => queryBuilderMock),
			execute: jest.fn(() => Promise.resolve()),
		};

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(TimeslotItemsRepository);
		await repository.deleteTimeslotsForSchedule(2);

		expect(TransactionManagerMock.createQueryBuilder).toBeCalledTimes(1);
		expect(queryBuilderMock.delete).toBeCalledTimes(1);
		expect(queryBuilderMock.where).toHaveBeenCalledWith('_timeslotsScheduleId = :scheduleId', { scheduleId: 2 });
		expect(queryBuilderMock.execute).toBeCalledTimes(1);
	});
});

class UserContextMock implements Partial<UserContext> {
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
