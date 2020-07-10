import { ServicesRepository } from "../services.repository";
import { DbConnection } from "../../core/db.connection";
import { Container } from "typescript-ioc";
import { Schedule, Service, TimeslotsSchedule } from "../../models";
import { SchedulesRepository } from '../../schedules/schedules.repository';
import { TimeslotsScheduleRepository } from "../../timeslotItems/timeslotsSchedule.repository";

describe("Services repository", () => {
	beforeEach(() => {
		Container.bind(DbConnection).to(MockDBConnection);
		Container.bind(SchedulesRepository).to(SchedulesRepositoryMock);
		Container.bind(TimeslotsScheduleRepository).to(TimeslotsScheduleRepositoryMock);

		jest.resetAllMocks();
	});

	it("should get list of services", async () => {
		MockDBConnection.find.mockImplementation(() => Promise.resolve([]));

		const repository = Container.get(ServicesRepository);
		const result = await repository.getAll();
		expect(result).toStrictEqual([]);
	});

	it("should get a service", async () => {
		const data = new Service();
		MockDBConnection.findOne.mockImplementation(() => Promise.resolve(data));

		const repository = Container.get(ServicesRepository);
		const result = await repository.getService(1);
		expect(result).toStrictEqual(data);
	});

	it("should get a service with schedule", async () => {
		const data = new Service();
		data.scheduleId = 11;

		const schedule = new Schedule();
		schedule.id = 11;
		SchedulesRepositoryMock.getSchedulesMock.mockImplementation(() => Promise.resolve([schedule]));
		MockDBConnection.findOne.mockImplementation(() => Promise.resolve(data));

		const repository = Container.get(ServicesRepository);
		const result = await repository.getServiceWithSchedule(1);
		expect(result).toBeDefined();
		expect(result.schedule).toBe(schedule);
	});

	it("should get a service with TimeslotsSchedule", async () => {
		const data = new Service();
		data.timeslotsScheduleId = 2;

		const timeslotsSchedule = new TimeslotsSchedule();
		timeslotsSchedule._id = 2;
		TimeslotsScheduleRepositoryMock.getTimeslotsScheduleByIdMock.mockImplementation(() => Promise.resolve(timeslotsSchedule));
		MockDBConnection.findOne.mockImplementation(() => Promise.resolve(data));

		const repository = Container.get(ServicesRepository);
		const result = await repository.getServiceWithTimeslotsSchedule(1);
		expect(result).toBeDefined();
		expect(result.timeslotsSchedule).toBeDefined();
	});

	it("should save a service", async () => {
		const service: Service = new Service();
		service.name = "Coaches";

		MockDBConnection.save.mockImplementation(() => Promise.resolve(service));
		const repository = Container.get(ServicesRepository);

		await repository.save(service);
		expect(MockDBConnection.save.mock.calls[0][0]).toStrictEqual(service);
	});

});

class MockDBConnection extends DbConnection {
	public static save = jest.fn();
	public static find = jest.fn();
	public static findOne = jest.fn();

	public async getConnection(): Promise<any> {
		const connection = {
			getRepository: () => ({
				find: MockDBConnection.find,
				findOne: MockDBConnection.findOne,
				save: MockDBConnection.save,
			})
		};
		return Promise.resolve(connection);
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

