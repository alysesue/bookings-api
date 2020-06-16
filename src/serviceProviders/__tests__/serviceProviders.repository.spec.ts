import { ServiceProvidersRepository } from "../serviceProviders.repository";
import { DbConnection } from "../../core/db.connection";
import { Container } from "typescript-ioc";
import { Service, ServiceProvider } from "../../models";
import { SchedulesRepository } from "../../schedules/schedules.repository";
import { IEntityWithSchedule } from "../../models/interfaces";

describe("Service Provider repository", () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it("should get list of SP", async () => {
		Container.bind(DbConnection).to(MockDBConnection);
		MockDBConnection.find.mockImplementation(() => Promise.resolve([]));

		const spRepository = Container.get(ServiceProvidersRepository);
		const result = await spRepository.getServiceProviders({ serviceId: 1 });
		expect(result).toStrictEqual([]);
	});

	it("should get a service provider", async () => {
		Container.bind(DbConnection).to(MockDBConnection);
		MockDBConnection.findOne.mockImplementation(() => Promise.resolve({ name: "Monica" }));

		const spRepository = Container.get(ServiceProvidersRepository);
		const result = await spRepository.getServiceProvider({ id: 1 });

		expect(result).toStrictEqual({ name: "Monica" });
	});

	it("should get list of SP with schedule", async () => {
		Container.bind(DbConnection).to(MockDBConnection);
		Container.bind(SchedulesRepository).to(SchedulesRepositoryMock);
		MockDBConnection.find.mockImplementation(() => Promise.resolve([new ServiceProvider()]));
		SchedulesRepositoryMock.populateSchedulesMock.mockImplementation((entries: any[]) => Promise.resolve(entries));

		const spRepository = Container.get(ServiceProvidersRepository);
		const result = await spRepository.getServiceProviders({ serviceId: 1, includeSchedule: true });

		expect(SchedulesRepositoryMock.populateSchedulesMock).toHaveBeenCalled();
		expect(result.length).toBe(1);
	});

	it("should get a service provider  with schedule", async () => {
		Container.bind(DbConnection).to(MockDBConnection);
		Container.bind(SchedulesRepository).to(SchedulesRepositoryMock);
		MockDBConnection.findOne.mockImplementation(() => Promise.resolve(new ServiceProvider()));
		SchedulesRepositoryMock.populateSingleEntryScheduleMock.mockImplementation((entry: any) => Promise.resolve(entry));

		const spRepository = Container.get(ServiceProvidersRepository);
		const result = await spRepository.getServiceProvider({ id: 1, includeSchedule: true });

		expect(SchedulesRepositoryMock.populateSingleEntryScheduleMock).toHaveBeenCalled();
		expect(result).toBeDefined();
	});


	it("should save service provider", async () => {
		const spInput: ServiceProvider = ServiceProvider.create("abc", null, 1);

		Container.bind(DbConnection).to(MockDBConnection);
		MockDBConnection.save.mockImplementation(() => Promise.resolve(spInput));
		const spRepository = Container.get(ServiceProvidersRepository);

		await spRepository.save(spInput);
		expect(MockDBConnection.save.mock.calls[0][0]).toStrictEqual(spInput);
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
	public static populateSchedulesMock = jest.fn();
	public static populateSingleEntryScheduleMock = jest.fn();

	public async populateSchedules<T extends IEntityWithSchedule>(entries: T[]): Promise<T[]> {
		return await SchedulesRepositoryMock.populateSchedulesMock(entries);
	}

	public async populateSingleEntrySchedule<T extends IEntityWithSchedule>(entry: T): Promise<T> {
		return await SchedulesRepositoryMock.populateSingleEntryScheduleMock(entry);
	}
}
