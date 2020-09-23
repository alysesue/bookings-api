import { ServicesRepository } from '../services.repository';
import { Container } from 'typescript-ioc';
import { Schedule, Service, TimeslotsSchedule, User } from '../../../models';
import { SchedulesRepository } from '../../schedules/schedules.repository';
import { TimeslotsScheduleRepository } from '../../timeslotsSchedules/timeslotsSchedule.repository';
import { TransactionManager } from '../../../core/transactionManager';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { AuthGroup, CitizenAuthGroup } from '../../../infrastructure/auth/authGroup';
import { ServiceRefInfo, ServicesRepositoryNoAuth } from '../services.noauth.repository';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
	Container.bind(SchedulesRepository).to(SchedulesRepositoryMock);
	Container.bind(TimeslotsScheduleRepository).to(TimeslotsScheduleRepositoryMock);
	Container.bind(UserContext).to(UserContextMock);
});

describe('Services repository', () => {
	const singpassUserMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');

	beforeEach(() => {
		jest.resetAllMocks();

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassUserMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new CitizenAuthGroup(singpassUserMock)]),
		);
	});

	it('should get list of services', async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([])),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(ServicesRepository);
		const result = await repository.getAll();
		expect(queryBuilderMock.getMany as jest.Mock).toBeCalled();
		expect(result).toStrictEqual([]);
	});

	it('should get a service', async () => {
		const data = new Service();
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve(data)),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(ServicesRepository);
		const result = await repository.getService(1);
		expect(queryBuilderMock.getOne as jest.Mock).toBeCalled();
		expect(result).toStrictEqual(data);
	});

	it('should get a service with schedule', async () => {
		const data = new Service();
		data.scheduleId = 11;

		const schedule = new Schedule();
		schedule.id = 11;
		SchedulesRepositoryMock.getSchedulesMock.mockImplementation(() => Promise.resolve([schedule]));
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve(data)),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(ServicesRepository);
		const result = await repository.getServiceWithSchedule(1);
		expect(result).toBeDefined();
		expect(result.schedule).toBe(schedule);
	});

	it('should get a service with TimeslotsSchedule', async () => {
		const data = new Service();
		data.timeslotsScheduleId = 2;

		const timeslotsSchedule = new TimeslotsSchedule();
		timeslotsSchedule._id = 2;
		TimeslotsScheduleRepositoryMock.getTimeslotsScheduleByIdMock.mockImplementation(() =>
			Promise.resolve(timeslotsSchedule),
		);
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve(data)),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(ServicesRepository);
		const result = await repository.getServiceWithTimeslotsSchedule(1);
		expect(result).toBeDefined();
		expect(result.timeslotsSchedule).toBeDefined();
	});

	it('should save a service', async () => {
		const service: Service = new Service();
		service.name = 'Coaches';

		TransactionManagerMock.save.mockImplementation(() => Promise.resolve(service));
		const repository = Container.get(ServicesRepository);

		await repository.save(service);
		expect(TransactionManagerMock.save.mock.calls[0][0]).toStrictEqual(service);
	});

	it('should get services for user groups (service reference)', async () => {
		const serviceMock: Service = new Service();
		serviceMock.name = 'Coaches';

		const serviceRefInfo: ServiceRefInfo = {
			serviceRef: 'serviceRef',
			organisationRef: 'OrganisationRef',
		};

		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([serviceMock])),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(ServicesRepositoryNoAuth);
		const result = await repository.getServicesForUserGroups([serviceRefInfo]);
		expect(result).toEqual([serviceMock]);
	});

	it('should return empty', async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([])),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(ServicesRepositoryNoAuth);
		const result = await repository.getServicesForUserGroups([]);
		expect(result).toEqual([]);
	});
});

class TransactionManagerMock extends TransactionManager {
	public static createQueryBuilder = jest.fn();
	public static save = jest.fn();
	public static find = jest.fn();
	public static findOne = jest.fn();

	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: () => ({
				createQueryBuilder: TransactionManagerMock.createQueryBuilder,
				find: TransactionManagerMock.find,
				findOne: TransactionManagerMock.findOne,
				save: TransactionManagerMock.save,
			}),
		};
		return Promise.resolve(entityManager);
	}
}

class SchedulesRepositoryMock extends SchedulesRepository {
	public static getSchedulesMock = jest.fn();

	public async getSchedules(...params): Promise<Schedule[]> {
		return await SchedulesRepositoryMock.getSchedulesMock(...params);
	}
}

class TimeslotsScheduleRepositoryMock extends TimeslotsScheduleRepository {
	public static getTimeslotsScheduleByIdMock = jest.fn();

	public async getTimeslotsScheduleById(...params): Promise<TimeslotsSchedule> {
		return await TimeslotsScheduleRepositoryMock.getTimeslotsScheduleByIdMock(...params);
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
