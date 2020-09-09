import { ServiceProvidersRepository } from '../serviceProviders.repository';
import { Container } from 'typescript-ioc';
import { ServiceProvider, TimeslotsSchedule } from '../../../models';
import { SchedulesRepository } from '../../schedules/schedules.repository';
import { IEntityWithSchedule } from '../../../models/interfaces';
import { TimeslotsScheduleRepository } from '../../timeslotsSchedules/timeslotsSchedule.repository';
import { TransactionManager } from '../../../core/transactionManager';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
});

describe('Service Provider repository', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should get list of SP', async () => {
		TransactionManagerMock.find.mockImplementation(() => Promise.resolve([]));

		const spRepository = Container.get(ServiceProvidersRepository);
		const result = await spRepository.getServiceProviders({ serviceId: 1 });
		expect(result).toStrictEqual([]);
	});

	it('should get list of SP by ids', async () => {
		TransactionManagerMock.find.mockImplementation(() => Promise.resolve([]));

		const spRepository = Container.get(ServiceProvidersRepository);
		const result = await spRepository.getServiceProviders({ ids: [4, 5], serviceId: 1 });
		expect(result).toStrictEqual([]);
	});

	it('should get a service provider', async () => {
		TransactionManagerMock.findOne.mockImplementation(() => Promise.resolve({ name: 'Monica' }));

		const spRepository = Container.get(ServiceProvidersRepository);
		const result = await spRepository.getServiceProvider({ id: 1 });

		expect(result).toStrictEqual({ name: 'Monica' });
	});

	it('should get list of SP with schedule', async () => {
		Container.bind(SchedulesRepository).to(SchedulesRepositoryMock);
		TransactionManagerMock.find.mockImplementation(() => Promise.resolve([new ServiceProvider()]));
		SchedulesRepositoryMock.populateSchedulesMock.mockImplementation((entries: any[]) => Promise.resolve(entries));

		const spRepository = Container.get(ServiceProvidersRepository);
		const result = await spRepository.getServiceProviders({ serviceId: 1, includeSchedule: true });

		expect(SchedulesRepositoryMock.populateSchedulesMock).toHaveBeenCalled();
		expect(result.length).toBe(1);
	});

	it('should get a service provider with schedule', async () => {
		Container.bind(SchedulesRepository).to(SchedulesRepositoryMock);
		TransactionManagerMock.findOne.mockImplementation(() => Promise.resolve(new ServiceProvider()));
		SchedulesRepositoryMock.populateSchedulesMock.mockImplementation((entries: any[]) => Promise.resolve(entries));

		const spRepository = Container.get(ServiceProvidersRepository);
		const result = await spRepository.getServiceProvider({ id: 1, includeSchedule: true });

		expect(SchedulesRepositoryMock.populateSchedulesMock).toHaveBeenCalled();
		expect(result).toBeDefined();
	});

	it('should get list of SP with TimeslotsSchedule', async () => {
		Container.bind(TimeslotsScheduleRepository).to(TimeslotsScheduleRepositoryMock);

		const sp = new ServiceProvider();
		sp.id = 1;
		sp.timeslotsScheduleId = 2;
		const timeslotsSchedule = new TimeslotsSchedule();
		timeslotsSchedule._id = 2;
		TransactionManagerMock.find.mockImplementation(() => Promise.resolve([sp]));
		TimeslotsScheduleRepositoryMock.getTimeslotsSchedulesMock.mockImplementation(() =>
			Promise.resolve([timeslotsSchedule]),
		);

		const spRepository = Container.get(ServiceProvidersRepository);
		const result = await spRepository.getServiceProviders({ serviceId: 1, includeTimeslotsSchedule: true });

		expect(TransactionManagerMock.find).toHaveBeenCalled();
		expect(TimeslotsScheduleRepositoryMock.getTimeslotsSchedulesMock).toHaveBeenCalled();
		expect(result.length).toBe(1);
		expect(result[0].timeslotsSchedule).toBeDefined();
	});

	it('should get a service provider with TimeslotsSchedule', async () => {
		Container.bind(TimeslotsScheduleRepository).to(TimeslotsScheduleRepositoryMock);

		const sp = new ServiceProvider();
		sp.id = 1;
		sp.timeslotsScheduleId = 2;
		const timeslotsSchedule = new TimeslotsSchedule();
		timeslotsSchedule._id = 2;
		TransactionManagerMock.findOne.mockImplementation(() => sp);
		TimeslotsScheduleRepositoryMock.getTimeslotsSchedulesMock.mockImplementation(() =>
			Promise.resolve([timeslotsSchedule]),
		);

		const spRepository = Container.get(ServiceProvidersRepository);
		const result = await spRepository.getServiceProvider({ id: 1, includeTimeslotsSchedule: true });

		expect(TransactionManagerMock.findOne).toHaveBeenCalled();
		expect(TimeslotsScheduleRepositoryMock.getTimeslotsSchedulesMock).toHaveBeenCalled();
		expect(result).toBeDefined();
		expect(result.timeslotsSchedule).toBeDefined();
	});

	it('should save service provider', async () => {
		const spInput: ServiceProvider = ServiceProvider.create('abc', null, 1);

		TransactionManagerMock.save.mockImplementation(() => Promise.resolve(spInput));
		const spRepository = Container.get(ServiceProvidersRepository);

		await spRepository.save(spInput);
		expect(TransactionManagerMock.save.mock.calls[0][0]).toStrictEqual(spInput);
	});
});

class TransactionManagerMock extends TransactionManager {
	public static save = jest.fn();
	public static find = jest.fn();
	public static findOne = jest.fn();

	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: () => ({
				find: TransactionManagerMock.find,
				findOne: TransactionManagerMock.findOne,
				save: TransactionManagerMock.save,
			}),
		};
		return Promise.resolve(entityManager);
	}
}

class SchedulesRepositoryMock extends SchedulesRepository {
	public static populateSchedulesMock = jest.fn();
	public static populateSingleEntryScheduleMock = jest.fn();

	public async populateSchedules<T extends IEntityWithSchedule>(entries: T[]): Promise<T[]> {
		return await SchedulesRepositoryMock.populateSchedulesMock(entries);
	}

	public async populateSingleEntrySchedule<T extends IEntityWithSchedule>(entry: T): Promise<T> {
		return await SchedulesRepositoryMock.populateSingleEntryScheduleMock(entry);
	}
}

class TimeslotsScheduleRepositoryMock extends TimeslotsScheduleRepository {
	public static getTimeslotsScheduleByIdMock = jest.fn();
	public static getTimeslotsSchedulesMock = jest.fn();

	public async getTimeslotsScheduleById(id: number): Promise<TimeslotsSchedule> {
		return await TimeslotsScheduleRepositoryMock.getTimeslotsScheduleByIdMock(id);
	}
	public async getTimeslotsSchedules(ids: number[]): Promise<TimeslotsSchedule[]> {
		return await TimeslotsScheduleRepositoryMock.getTimeslotsSchedulesMock(ids);
	}
}
