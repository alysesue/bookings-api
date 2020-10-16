import { ServiceProvidersRepository } from '../serviceProviders.repository';
import { Container } from 'typescript-ioc';
import { ScheduleFormsRepository } from '../../scheduleForms/scheduleForms.repository';
import { IEntityWithScheduleForm } from '../../../models/interfaces';
import { Organisation, ServiceProvider, ServiceProviderGroupMap, TimeslotsSchedule, User } from '../../../models';
import { TimeslotsScheduleRepository } from '../../timeslotsSchedules/timeslotsSchedule.repository';
import { TransactionManager } from '../../../core/transactionManager';
import { ServiceProvidersQueryAuthVisitor } from '../serviceProviders.auth';
import { UserConditionParams } from '../../../infrastructure/auth/authConditionCollection';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { AuthGroup, OrganisationAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { UsersRepository } from '../../../components/users/users.repository';

jest.mock('../serviceProviders.auth');

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
	Container.bind(UserContext).to(UserContextMock);
	Container.bind(ScheduleFormsRepository).to(ScheduleFormsRepositoryMock);
	Container.bind(TimeslotsScheduleRepository).to(TimeslotsScheduleRepositoryMock);
	Container.bind(UsersRepository).to(UsersRepositoryMock);
});

describe('Service Provider repository', () => {
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
		where: jest.Mock;
		leftJoin: jest.Mock;
		leftJoinAndSelect: jest.Mock;
		getMany: jest.Mock<Promise<ServiceProvider[]>, any>;
		getOne: jest.Mock<Promise<ServiceProvider>, any>;
	} = {
		where: jest.fn(),
		leftJoin: jest.fn(),
		leftJoinAndSelect: jest.fn(),
		getMany: jest.fn<Promise<ServiceProvider[]>, any>(),
		getOne: jest.fn<Promise<ServiceProvider>, any>(),
	};

	const QueryAuthVisitorMock = {
		createUserVisibilityCondition: jest.fn<Promise<UserConditionParams>, any>(),
	};

	beforeEach(() => {
		jest.resetAllMocks();

		queryBuilderMock.where.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.leftJoin.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.leftJoinAndSelect.mockImplementation(() => queryBuilderMock);

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		(ServiceProvidersQueryAuthVisitor as jest.Mock).mockImplementation(() => QueryAuthVisitorMock);
		QueryAuthVisitorMock.createUserVisibilityCondition.mockImplementation(() =>
			Promise.resolve({ userCondition: '', userParams: {} }),
		);

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(userMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(userMock, [organisation])]),
		);

		UsersRepositoryMock.getUsersByMolAdminIds.mockImplementation(() => Promise.resolve([]));
	});

	it('should get list of SP', async () => {
		queryBuilderMock.getMany.mockImplementation(() => Promise.resolve([]));

		const spRepository = Container.get(ServiceProvidersRepository);

		const result = await spRepository.getServiceProviders({ serviceId: 1 });
		expect(TransactionManagerMock.createQueryBuilder).toBeCalled();
		expect(queryBuilderMock.getMany).toBeCalled();
		expect(QueryAuthVisitorMock.createUserVisibilityCondition).toBeCalled();
		expect(result).toBeDefined();
	});

	it('should skip authorisation check', async () => {
		queryBuilderMock.getMany.mockImplementation(() => Promise.resolve([]));

		const spRepository = Container.get(ServiceProvidersRepository);

		const result = await spRepository.getServiceProviders({ serviceId: 1, skipAuthorisation: true });
		expect(TransactionManagerMock.createQueryBuilder).toBeCalled();
		expect(queryBuilderMock.getMany).toBeCalled();
		expect(QueryAuthVisitorMock.createUserVisibilityCondition).not.toBeCalled();
		expect(result).toBeDefined();
	});

	it('should get list of SP by ids', async () => {
		queryBuilderMock.getMany.mockImplementation(() => Promise.resolve([]));

		const spRepository = Container.get(ServiceProvidersRepository);

		const result = await spRepository.getServiceProviders({ ids: [4, 5], serviceId: 1 });
		expect(TransactionManagerMock.createQueryBuilder).toBeCalled();
		expect(queryBuilderMock.where).toHaveBeenCalledWith(
			'(sp."_serviceId" = :serviceId) AND (sp._id IN (:...ids))',
			{ ids: [4, 5], serviceId: 1 },
		);
		expect(queryBuilderMock.getMany).toBeCalled();
		expect(QueryAuthVisitorMock.createUserVisibilityCondition).toBeCalled();
		expect(result).toBeDefined();
	});

	it('should get a service provider', async () => {
		const serviceProvider = ServiceProvider.create('J', 1);
		serviceProvider.id = 1;
		queryBuilderMock.getOne.mockImplementation(() => Promise.resolve(serviceProvider));

		const spRepository = Container.get(ServiceProvidersRepository);
		const result = await spRepository.getServiceProvider({ id: 1 });

		expect(TransactionManagerMock.createQueryBuilder).toBeCalled();
		expect(queryBuilderMock.where).toHaveBeenCalledWith('(sp._id = :id)', { id: 1 });
		expect(queryBuilderMock.getOne).toBeCalled();
		expect(QueryAuthVisitorMock.createUserVisibilityCondition).toBeCalled();
		expect(result).toBeDefined();
	});

	it('should get list of SP with schedule', async () => {
		queryBuilderMock.getMany.mockImplementation(() => Promise.resolve([ServiceProvider.create('J', 1)]));

		const spRepository = Container.get(ServiceProvidersRepository);
		const result = await spRepository.getServiceProviders({ serviceId: 1, includeScheduleForm: true });

		expect(ScheduleFormsRepositoryMock.populateScheduleFormsMock).toHaveBeenCalled();
		expect(result.length).toBe(1);
	});

	it('should get a service provider with schedule', async () => {
		queryBuilderMock.getOne.mockImplementation(() => Promise.resolve(ServiceProvider.create('J', 1)));

		const spRepository = Container.get(ServiceProvidersRepository);
		const result = await spRepository.getServiceProvider({ id: 1, includeScheduleForm: true });

		expect(ScheduleFormsRepositoryMock.populateScheduleFormsMock).toHaveBeenCalled();
		expect(result).toBeDefined();
	});

	it('should get list of SP with TimeslotsSchedule', async () => {
		const sp = ServiceProvider.create('', 1);
		sp.id = 1;
		sp.timeslotsScheduleId = 2;

		queryBuilderMock.getMany.mockImplementation(() => Promise.resolve([sp]));
		TimeslotsScheduleRepositoryMock.populateTimeslotsSchedules.mockImplementation(
			async (entries: ServiceProvider[]) => {
				for (const entry of entries) {
					entry.timeslotsSchedule = new TimeslotsSchedule();
				}
				return entries;
			},
		);

		const spRepository = Container.get(ServiceProvidersRepository);
		const result = await spRepository.getServiceProviders({ serviceId: 1, includeTimeslotsSchedule: true });

		expect(queryBuilderMock.getMany).toHaveBeenCalled();
		expect(TimeslotsScheduleRepositoryMock.populateTimeslotsSchedules).toHaveBeenCalled();
		expect(result.length).toBe(1);
		expect(result[0].timeslotsSchedule).toBeDefined();
	});

	it('should get a service provider with TimeslotsSchedule', async () => {
		const sp = ServiceProvider.create('sp1', 1);
		sp.id = 1;
		sp.timeslotsScheduleId = 2;

		queryBuilderMock.getOne.mockImplementation(() => Promise.resolve(sp));
		TimeslotsScheduleRepositoryMock.populateTimeslotsSchedules.mockImplementation(
			async (entries: ServiceProvider[]) => {
				for (const entry of entries) {
					entry.timeslotsSchedule = new TimeslotsSchedule();
				}
				return entries;
			},
		);

		const spRepository = Container.get(ServiceProvidersRepository);
		const result = await spRepository.getServiceProvider({ id: 1, includeTimeslotsSchedule: true });

		expect(queryBuilderMock.getOne).toHaveBeenCalled();
		expect(TimeslotsScheduleRepositoryMock.populateTimeslotsSchedules).toHaveBeenCalled();
		expect(result).toBeDefined();
		expect(result.timeslotsSchedule).toBeDefined();
	});

	it('should save service provider', async () => {
		const spInput: ServiceProvider = ServiceProvider.create('abc', 1);

		TransactionManagerMock.save.mockImplementation(() => Promise.resolve(spInput));
		const spRepository = Container.get(ServiceProvidersRepository);

		await spRepository.save(spInput);
		expect(TransactionManagerMock.save.mock.calls[0][0]).toStrictEqual(spInput);
	});

	it('should get linked user', async () => {
		const serviceProvider = ServiceProvider.create('J', 1);
		serviceProvider.id = 1;
		serviceProvider._serviceProviderGroupMap = new ServiceProviderGroupMap();
		serviceProvider._serviceProviderGroupMap.molAdminId = userMock.adminUser.molAdminId;
		serviceProvider._serviceProviderGroupMap.serviceProviderId = serviceProvider.id;

		UsersRepositoryMock.getUsersByMolAdminIds.mockImplementation(() => Promise.resolve([userMock]));
		queryBuilderMock.getOne.mockImplementation(() => Promise.resolve(serviceProvider));

		const spRepository = Container.get(ServiceProvidersRepository);
		const result = await spRepository.getServiceProvider({ id: 1 });

		expect(result).toBeDefined();
		expect(result.linkedUser).toBeDefined();
		expect(result.agencyUserId).toBe('ABC12');
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

class ScheduleFormsRepositoryMock extends ScheduleFormsRepository {
	public static populateScheduleFormsMock = jest.fn();
	public static populateSingleEntryScheduleFormMock = jest.fn();

	public async populateScheduleForms<T extends IEntityWithScheduleForm>(entries: T[]): Promise<T[]> {
		return await ScheduleFormsRepositoryMock.populateScheduleFormsMock(entries);
	}

	public async populateSingleEntryScheduleForm<T extends IEntityWithScheduleForm>(entry: T): Promise<T> {
		return await ScheduleFormsRepositoryMock.populateSingleEntryScheduleFormMock(entry);
	}
}

class TimeslotsScheduleRepositoryMock extends TimeslotsScheduleRepository {
	public static populateTimeslotsSchedules = jest.fn<Promise<any>, any>();

	public async populateTimeslotsSchedules(...params): Promise<any> {
		return await TimeslotsScheduleRepositoryMock.populateTimeslotsSchedules(...params);
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
