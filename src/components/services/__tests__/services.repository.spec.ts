import { ServicesRepository } from '../services.repository';
import { Container } from 'typescript-ioc';
import { Schedule, Service, TimeslotsSchedule } from '../../../models';
import { SchedulesRepository } from '../../schedules/schedules.repository';
import { TimeslotsScheduleRepository } from '../../timeslotsSchedules/timeslotsSchedule.repository';
import { TransactionManager } from '../../../core/transactionManager';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
	Container.bind(SchedulesRepository).to(SchedulesRepositoryMock);
	Container.bind(TimeslotsScheduleRepository).to(TimeslotsScheduleRepositoryMock);
});

describe('Services repository', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should get list of services', async () => {
		TransactionManagerMock.find.mockImplementation(() => Promise.resolve([]));

		const repository = Container.get(ServicesRepository);
		const result = await repository.getAll();
		expect(result).toStrictEqual([]);
	});

	it('should get a service', async () => {
		const data = new Service();
		TransactionManagerMock.findOne.mockImplementation(() => Promise.resolve(data));

		const repository = Container.get(ServicesRepository);
		const result = await repository.getService(1);
		expect(result).toStrictEqual(data);
	});

	it('should get a service with schedule', async () => {
		const data = new Service();
		data.scheduleId = 11;

		const schedule = new Schedule();
		schedule.id = 11;
		SchedulesRepositoryMock.getSchedulesMock.mockImplementation(() => Promise.resolve([schedule]));
		TransactionManagerMock.findOne.mockImplementation(() => Promise.resolve(data));

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
		TransactionManagerMock.findOne.mockImplementation(() => Promise.resolve(data));

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
