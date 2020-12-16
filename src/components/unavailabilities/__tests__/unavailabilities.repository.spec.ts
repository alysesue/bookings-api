import { Container } from 'typescript-ioc';
import { UnavailabilitiesRepository } from '../unavailabilities.repository';
import { Organisation, ServiceProvider, Unavailability, User } from '../../../models';
import { SelectQueryBuilder } from 'typeorm';
import { AsyncFunction, TransactionManager } from '../../../core/transactionManager';
import { UnavailabilitiesQueryAuthVisitor } from '../unavailabilities.auth';
import { UserConditionParams } from '../../../infrastructure/auth/authConditionCollection';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { AuthGroup, OrganisationAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

jest.mock('../unavailabilities.auth');

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
	Container.bind(UserContext).to(UserContextMock);
});

// tslint:disable-next-line:no-big-function
describe('Unavailabilities repository', () => {
	const userMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});
	const organisation = new Organisation();
	organisation.id = 1;

	const QueryAuthVisitorMock = {
		createUserVisibilityCondition: jest.fn<Promise<UserConditionParams>, any>(),
	};

	beforeEach(() => {
		jest.resetAllMocks();

		(UnavailabilitiesQueryAuthVisitor as jest.Mock).mockImplementation(() => QueryAuthVisitorMock);
		QueryAuthVisitorMock.createUserVisibilityCondition.mockImplementation(() =>
			Promise.resolve({ userCondition: '', userParams: {} }),
		);

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(userMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(userMock, [organisation])]),
		);
	});

	it('should save an unavailability', async () => {
		const entry = Unavailability.create();
		entry.id = 1;

		TransactionManagerMock.save.mockImplementation(() => Promise.resolve(entry));
		const repository = Container.get(UnavailabilitiesRepository);

		const saved = await repository.save(entry);
		expect(TransactionManagerMock.save).toHaveBeenCalled();
		expect(saved).toBeDefined();
	});

	it('should retrieve unavailabilities for a service', async () => {
		const queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			leftJoin: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([])),
		} as unknown) as SelectQueryBuilder<Unavailability>;

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(UnavailabilitiesRepository);

		const results = await repository.search({
			from: new Date(),
			to: new Date(),
			serviceId: 1,
		});

		const whereParam = '(u."_serviceId" = :serviceId) AND (u."_start" < :to AND u."_end" > :from)';
		expect((queryBuilderMock.where as jest.Mock).mock.calls[0][0]).toBe(whereParam);
		expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalled();
		expect(queryBuilderMock.getMany).toHaveBeenCalled();
		expect(QueryAuthVisitorMock.createUserVisibilityCondition).toHaveBeenCalled();
		expect(results).toBeDefined();
	});

	it('should retrieve unavailabilities for a service (without auth)', async () => {
		const queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			leftJoin: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([])),
		} as unknown) as SelectQueryBuilder<Unavailability>;

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(UnavailabilitiesRepository);

		const results = await repository.search({
			from: new Date(),
			to: new Date(),
			serviceId: 1,
			skipAuthorisation: true,
		});

		const whereParam = '(u."_serviceId" = :serviceId) AND (u."_start" < :to AND u."_end" > :from)';
		expect((queryBuilderMock.where as jest.Mock).mock.calls[0][0]).toBe(whereParam);
		expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalled();
		expect(queryBuilderMock.getMany).toHaveBeenCalled();
		expect(QueryAuthVisitorMock.createUserVisibilityCondition).not.toHaveBeenCalled();
		expect(results).toBeDefined();
	});

	it('should count unavailabilities for a service', async () => {
		const queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			leftJoin: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([])),
			getCount: jest.fn(() => Promise.resolve(1)),
		} as unknown) as SelectQueryBuilder<Unavailability>;

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(UnavailabilitiesRepository);

		const count = await repository.searchCount({
			from: new Date(),
			to: new Date(),
			serviceId: 1,
		});

		const whereParam = '(u."_serviceId" = :serviceId) AND (u."_start" < :to AND u."_end" > :from)';
		expect((queryBuilderMock.where as jest.Mock).mock.calls[0][0]).toBe(whereParam);
		expect(queryBuilderMock.getCount).toHaveBeenCalled();
		expect(count).toBe(1);
	});

	it('should retrieve unavailabilities for a service provider', async () => {
		const queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			leftJoin: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([])),
		} as unknown) as SelectQueryBuilder<Unavailability>;

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(UnavailabilitiesRepository);

		const results = await repository.search({
			from: new Date(),
			to: new Date(),
			serviceId: 1,
			serviceProviderId: 2,
		});

		const whereParam =
			'(u."_serviceId" = :serviceId) AND (u."_start" < :to AND u."_end" > :from) AND ((u."_allServiceProviders" AND EXISTS(SELECT 1 FROM public.service_provider esp WHERE esp."_id" = :serviceProviderId AND esp."_serviceId" = u."_serviceId")) OR EXISTS(SELECT 1 FROM public.unavailable_service_provider usp WHERE usp."unavailability_id" = u."_id" AND usp."serviceProvider_id" = :serviceProviderId))';
		expect((queryBuilderMock.where as jest.Mock).mock.calls[0][0]).toBe(whereParam);
		expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalled();
		expect(queryBuilderMock.getMany).toHaveBeenCalled();
		expect(results).toBeDefined();
	});

	it('should not get unavailability for a service provider', async () => {
		const queryBuilderMock = ({
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			where: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve([])),
		} as unknown) as SelectQueryBuilder<Unavailability>;

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => {
			return queryBuilderMock;
		});

		const unavailability = new Unavailability();
		unavailability.id = 2;
		unavailability.allServiceProviders = true;
		unavailability.serviceProviders = [];
		const repository = Container.get(UnavailabilitiesRepository);
		const entry = await repository.get({ id: null });

		expect(entry).toBeNull();
	});

	it('should get unavailability for a service provider', async () => {
		const queryBuilderMock = ({
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			where: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve([])),
		} as unknown) as SelectQueryBuilder<Unavailability>;

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => {
			return queryBuilderMock;
		});

		const unavailability = new Unavailability();
		unavailability.id = 2;
		unavailability.allServiceProviders = true;
		unavailability.serviceProviders = [];
		const repository = Container.get(UnavailabilitiesRepository);
		const entry = await repository.get({ id: unavailability.id });

		expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalled();
		expect(queryBuilderMock.getOne).toHaveBeenCalled();
		expect(entry).toBeDefined();
	});

	it('should delete unavailability for all service providers', async () => {
		const queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			delete: jest.fn(() => queryBuilderMock),
			execute: jest.fn(() => Promise.resolve()),
		} as unknown) as SelectQueryBuilder<Unavailability>;

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => {
			return queryBuilderMock;
		});

		TransactionManagerMock.runInTransaction.mockImplementation(
			async (isolationLevel: IsolationLevel, asyncFunction: AsyncFunction<any>) => {
				await asyncFunction();
			},
		);

		const unavailability = new Unavailability();
		unavailability.id = 2;
		unavailability.allServiceProviders = true;
		unavailability.serviceProviders = [];
		const repository = Container.get(UnavailabilitiesRepository);
		await repository.delete(unavailability);

		const whereParam =
			'_id = :id AND NOT EXISTS(SELECT 1 FROM public.unavailable_service_provider sp_relation WHERE sp_relation.unavailability_id = :id)';
		const whereParam2 = { id: unavailability.id };
		expect(TransactionManagerMock.runInTransaction).toBeCalled();
		expect(queryBuilderMock.where).toBeCalled();
		expect((queryBuilderMock.where as jest.Mock).mock.calls[0][0]).toBe(whereParam);
		expect((queryBuilderMock.where as jest.Mock).mock.calls[0][1]).toStrictEqual(whereParam2);
		expect(queryBuilderMock.delete).toBeCalled();
		expect(queryBuilderMock.execute).toBeCalled();
	});

	it('should delete unavailability for multiple service provider', async () => {
		const queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			delete: jest.fn(() => queryBuilderMock),
			from: jest.fn(() => queryBuilderMock),
			execute: jest.fn(() => Promise.resolve()),
		} as unknown) as SelectQueryBuilder<Unavailability>;

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => {
			return queryBuilderMock;
		});

		TransactionManagerMock.runInTransaction.mockImplementation(
			async (isolationLevel: IsolationLevel, asyncFunction: AsyncFunction<any>) => {
				await asyncFunction();
			},
		);

		const serviceProviderA = ServiceProvider.create('Janephew', 1, 'Janephew@gmail.com');
		serviceProviderA.id = 100;
		const serviceProviderB = ServiceProvider.create('Janiece', 1, 'Janiece@gmail.com');
		serviceProviderB.id = 101;
		const unavailability = new Unavailability();
		unavailability.id = 1;
		unavailability.allServiceProviders = false;
		unavailability.serviceProviders = [serviceProviderA, serviceProviderB];
		const repository = Container.get(UnavailabilitiesRepository);
		await repository.delete(unavailability);

		expect(TransactionManagerMock.runInTransaction).toBeCalled();
		expect(queryBuilderMock.delete).toBeCalledTimes(2);
		expect(queryBuilderMock.where).toBeCalledTimes(2);
		expect(queryBuilderMock.from).toBeCalledTimes(1);
		expect(queryBuilderMock.execute).toBeCalledTimes(2);
	});
});

class TransactionManagerMock implements Partial<TransactionManager> {
	public static save = jest.fn();
	public static find = jest.fn();
	public static findOne = jest.fn();
	public static createQueryBuilder = jest.fn();
	public static runInTransaction = jest.fn();

	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: () => ({
				find: TransactionManagerMock.find,
				findOne: TransactionManagerMock.findOne,
				save: TransactionManagerMock.save,
				createQueryBuilder: TransactionManagerMock.createQueryBuilder,
			}),
		};
		return Promise.resolve(entityManager);
	}

	public async runInTransaction<T>(isolationLevel: IsolationLevel, asyncFunction: AsyncFunction<T>): Promise<T> {
		return TransactionManagerMock.runInTransaction(isolationLevel, asyncFunction);
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
