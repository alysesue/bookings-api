import { TransactionManager } from '../../../core/transactionManager';
import { OneOffTimeslot, Organisation, User } from '../../../models';
import { Container } from 'typescript-ioc';
import { OneOffTimeslotsRepository } from '../oneOffTimeslots.repository';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { OneOffTimeslotsQueryAuthVisitor } from '../oneOffTimeslots.auth';
import { UserConditionParams } from '../../../infrastructure/auth/authConditionCollection';
import { AuthGroup, OrganisationAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { SelectQueryBuilder } from 'typeorm';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';

jest.mock('../oneOffTimeslots.auth');

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
	Container.bind(UserContext).to(UserContextMock);
});

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('oneOffTimeslots repository tests', () => {
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

	beforeEach(() => {
		jest.resetAllMocks();

		(OneOffTimeslotsQueryAuthVisitor as jest.Mock).mockImplementation(() => QueryAuthVisitorMock);
		QueryAuthVisitorMock.createUserVisibilityCondition.mockImplementation(() =>
			Promise.resolve({ userCondition: '', userParams: {} }),
		);

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminUserMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(adminUserMock, [organisation])]),
		);
	});

	it('should save timeslot', async () => {
		const repository = Container.get(OneOffTimeslotsRepository);
		await repository.save([new OneOffTimeslot()]);
		expect(TransactionManagerMock.save).toBeCalled();
	});

	it('should get by id', async () => {
		const queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			leftJoin: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve(new OneOffTimeslot())),
		} as unknown) as SelectQueryBuilder<OneOffTimeslot>;
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(OneOffTimeslotsRepository);
		const result = await repository.getById({ id: 2 });
		expect(result).toBeDefined();
		expect(QueryAuthVisitorMock.createUserVisibilityCondition).toBeCalled();
		expect(queryBuilderMock.getOne).toBeCalled();
	});

	it('should search all timeslots (with visibility)', async () => {
		const queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			leftJoin: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([new OneOffTimeslot()])),
		} as unknown) as SelectQueryBuilder<OneOffTimeslot>;
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(OneOffTimeslotsRepository);
		const result = await repository.search({});
		expect(result).toBeDefined();
		expect(QueryAuthVisitorMock.createUserVisibilityCondition).toBeCalled();
		expect(queryBuilderMock.getMany).toBeCalled();
	});

	it('should search all timeslots (bypass auth)', async () => {
		const queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			leftJoin: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([])),
		} as unknown) as SelectQueryBuilder<OneOffTimeslot>;
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(OneOffTimeslotsRepository);
		await repository.search({ byPassAuth: true });
		expect(QueryAuthVisitorMock.createUserVisibilityCondition).not.toBeCalled();
		expect(queryBuilderMock.getMany).toBeCalled();
	});

	it('should search timeslots (with parameters)', async () => {
		const queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			leftJoin: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([])),
		} as unknown) as SelectQueryBuilder<OneOffTimeslot>;
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(OneOffTimeslotsRepository);
		await repository.search({ serviceId: 2, serviceProviderIds: [10, 11] });
		expect(QueryAuthVisitorMock.createUserVisibilityCondition).toBeCalled();
		expect(
			queryBuilderMock.where,
		).toBeCalledWith(
			'("serviceProvider"."_serviceId" = :serviceId) AND (timeslot."_serviceProviderId" IN (:...serviceProviderIds))',
			{ serviceId: 2, serviceProviderIds: [10, 11] },
		);
		expect(queryBuilderMock.getMany).toBeCalled();
	});

	it('should delete timeslots', async () => {
		const repository = Container.get(OneOffTimeslotsRepository);
		await repository.delete([new OneOffTimeslot()]);
		expect(TransactionManagerMock.delete).toBeCalled();
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
