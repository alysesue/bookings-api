import { ServicesRepository } from '../services.repository';
import { Container } from 'typescript-ioc';
import { Organisation, ScheduleForm, Service, ServiceAdminGroupMap, TimeslotsSchedule, User } from '../../../models';
import { ScheduleFormsRepository } from '../../scheduleForms/scheduleForms.repository';
import { TimeslotsScheduleRepository } from '../../timeslotsSchedules/timeslotsSchedule.repository';
import { TransactionManager } from '../../../core/transactionManager';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { AuthGroup, CitizenAuthGroup } from '../../../infrastructure/auth/authGroup';
import { ServiceRefInfo, ServicesRepositoryNoAuth } from '../services.noauth.repository';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';
import { TimeslotsScheduleRepositoryMock } from '../../../components/timeslotsSchedules/__mocks__/timeslotsSchedule.repository.mock';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
	Container.bind(ScheduleFormsRepository).to(ScheduleFormsRepositoryMock);
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
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
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
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve(data)),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(ServicesRepository);
		const result = await repository.getService({ id: 1 });
		expect(queryBuilderMock.getOne as jest.Mock).toBeCalled();
		expect(result).toStrictEqual(data);
	});

	it('should get a service with scheduleForm', async () => {
		const data = new Service();
		data.scheduleFormId = 11;

		const scheduleForm = new ScheduleForm();
		scheduleForm.id = 11;
		ScheduleFormsRepositoryMock.populateSingleEntryScheduleForm.mockImplementation((e: Service) => {
			e.scheduleForm = scheduleForm;
			return Promise.resolve(e);
		});

		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve(data)),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(ServicesRepository);
		const result = await repository.getServiceWithScheduleForm(1);
		expect(result).toBeDefined();
		expect(result.scheduleForm).toBe(scheduleForm);
	});

	it('should get a service with TimeslotsSchedule', async () => {
		const data = new Service();
		data.timeslotsScheduleId = 2;

		const timeslotsSchedule = new TimeslotsSchedule();
		timeslotsSchedule._id = 2;
		TimeslotsScheduleRepositoryMock.populateTimeslotsSchedules.mockImplementation(() => {
			data.timeslotsSchedule = timeslotsSchedule;
			return Promise.resolve([data]);
		});

		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
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
		service.organisation = new Organisation();
		service.organisation.name = 'localorg';
		service.organisation.id = 1;
		service.serviceAdminGroupMap = {} as ServiceAdminGroupMap;

		const queryBuilderMock = {
			andWhere: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve(service)),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

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

	it('should get service by name', async () => {
		const service1 = new Service();
		service1.name = 'Service 1';
		const service2 = new Service();
		service2.name = 'Service 2';
		const data: Service[] = [service1, service2];
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve(data)),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const names: string[] = ['Service 1', 'Service 2'];
		const repository = Container.get(ServicesRepository);
		const result = await repository.getServicesByName({ names, organisationId: 1 });
		expect(result).toHaveLength(2);
		expect(result[0].name).toEqual('Service 1');
	});
});

class ScheduleFormsRepositoryMock implements Partial<ScheduleFormsRepository> {
	public static getScheduleFormsMock = jest.fn();
	public static populateSingleEntryScheduleForm = jest.fn();

	public async getScheduleForms(...params): Promise<ScheduleForm[]> {
		return await ScheduleFormsRepositoryMock.getScheduleFormsMock(...params);
	}

	public async populateSingleEntryScheduleForm(...params): Promise<any> {
		return await ScheduleFormsRepositoryMock.populateSingleEntryScheduleForm(...params);
	}
}

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
