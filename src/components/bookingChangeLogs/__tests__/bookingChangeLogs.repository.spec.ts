import { Booking, BookingChangeLog, ChangeLogAction, Organisation, User } from '../../../models';
import { Container } from 'typescript-ioc';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { TransactionManager } from '../../../core/transactionManager';
import { BookingChangeLogsRepository } from '../bookingChangeLogs.repository';
import { SelectQueryBuilder } from 'typeorm';
import { AuthGroup, CitizenAuthGroup, OrganisationAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { BookingChangeLogsQueryAuthVisitor } from '../bookingChangeLogs.auth';
import { UserConditionParams } from '../../../infrastructure/auth/authConditionCollection';

jest.mock('../bookingChangeLogs.auth');

const singpassUserMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');

const adminUserMock = User.createAdminUser({
	molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
	agencyUserId: 'ABC1234',
	email: 'john@email.com',
	userName: 'JohnAdmin',
	name: 'John',
});

const organisation = new Organisation();
organisation.id = 1;

const QueryAuthVisitorMock = {
	createUserVisibilityCondition: jest.fn<Promise<UserConditionParams>, any>(),
};

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
	Container.bind(UserContext).to(UserContextMock);
});

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeEach(() => {
	jest.resetAllMocks();

	(BookingChangeLogsQueryAuthVisitor as jest.Mock).mockImplementation(() => QueryAuthVisitorMock);
	QueryAuthVisitorMock.createUserVisibilityCondition.mockImplementation(() =>
		Promise.resolve({ userCondition: '', userParams: {} }),
	);

	UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassUserMock));
	UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new CitizenAuthGroup(singpassUserMock)]));
});

describe('BookingChangeLogs repository', () => {
	it('should saveLog', async () => {
		const repo = Container.get(BookingChangeLogsRepository);

		const booking = new Booking();
		const changeLog = BookingChangeLog.create({
			booking,
			user: singpassUserMock,
			action: ChangeLogAction.Create,
			previousState: {},
			newState: {},
		});

		TransactionManagerMock.save.mockImplementation(() => Promise.resolve(changeLog));

		await repo.save(changeLog);
		expect(TransactionManagerMock.save).toBeCalled();
	});

	it('should retrieve logs', async () => {
		const queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([])),
		} as unknown) as SelectQueryBuilder<BookingChangeLog>;

		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(adminUserMock, [organisation])]),
		);

		const changedSince = new Date(Date.UTC(2020, 0, 1, 14, 0));
		const changedUntil = new Date(Date.UTC(2020, 0, 31, 14, 0));
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(BookingChangeLogsRepository);
		const results = await repository.getLogs({
			changedSince,
			changedUntil,
			bookingIds: [2, 3],
			serviceId: 1,
			byPassAuth: false,
		});

		const whereParam =
			'(changelog."_serviceId" = :serviceId) AND (changelog."_timestamp" >= :changedSince AND changelog."_timestamp" < :changedUntil) AND (changelog."_bookingId" IN (:...bookingIds))';
		expect((queryBuilderMock.where as jest.Mock).mock.calls[0][0]).toBe(whereParam);
		expect(queryBuilderMock.getMany).toHaveBeenCalled();
		expect(results).toBeDefined();
	});

	it('should not retrieve logs', async () => {
		const queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([])),
		} as unknown) as SelectQueryBuilder<BookingChangeLog>;

		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new CitizenAuthGroup(singpassUserMock)]),
		);

		const changedSince = new Date(Date.UTC(2020, 0, 1, 14, 0));
		const changedUntil = new Date(Date.UTC(2020, 0, 31, 14, 0));
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(BookingChangeLogsRepository);
		const results = await repository.getLogs({
			changedSince,
			changedUntil,
			bookingIds: [2, 3],
			serviceId: 1,
			byPassAuth: true,
		});

		const whereParam =
			'(changelog."_serviceId" = :serviceId) AND (changelog."_timestamp" >= :changedSince AND changelog."_timestamp" < :changedUntil) AND (changelog."_bookingId" IN (:...bookingIds))';
		expect((queryBuilderMock.where as jest.Mock).mock.calls[0][0]).toBe(whereParam);
		expect(queryBuilderMock.getMany).toHaveBeenCalled();
		expect(results).toBeDefined();
	});
});

class TransactionManagerMock extends TransactionManager {
	public static insert = jest.fn();
	public static find = jest.fn();
	public static update = jest.fn();
	public static findOne = jest.fn();
	public static save = jest.fn();
	public static createQueryBuilder = jest.fn();

	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: () => ({
				find: TransactionManagerMock.find,
				findOne: TransactionManagerMock.findOne,
				insert: TransactionManagerMock.insert,
				update: TransactionManagerMock.update,
				save: TransactionManagerMock.save,
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
