import { DbConnection } from "../../core/db.connection";
import { Container } from "typescript-ioc";
import { UnavailabilitiesRepository } from "../unavailabilities.repository";
import { Unavailability } from "../../models";
import { SelectQueryBuilder } from "typeorm";

describe("Unavailabilities repository", () => {
	beforeEach(() => {
		Container.bind(DbConnection).to(MockDBConnection);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it("should save an unavailability", async () => {
		const entry = Unavailability.create();
		entry.id = 1;

		MockDBConnection.save.mockImplementation(() => Promise.resolve(entry));
		const repository = Container.get(UnavailabilitiesRepository);

		const saved = await repository.save(entry);
		expect(MockDBConnection.save).toHaveBeenCalled();
		expect(saved).toBeDefined();
	});

	it("should retrieve unavailabilities for a service", async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([])),
		} as unknown as SelectQueryBuilder<Unavailability>;

		MockDBConnection.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(UnavailabilitiesRepository);

		const results = await repository.search({
			from: new Date(),
			to: new Date(),
			serviceId: 1,
		});

		const whereParam = "u._serviceId = :serviceId AND (u.\"_start\" <= :to AND u.\"_end\" >= :from)";
		expect((queryBuilderMock.where as jest.Mock).mock.calls[0][0]).toBe(whereParam);
		expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalled();
		expect(queryBuilderMock.getMany).toHaveBeenCalled();
		expect(results).toBeDefined();
	});

	it("should retrieve unavailabilities for a service provider", async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([])),
		} as unknown as SelectQueryBuilder<Unavailability>;

		MockDBConnection.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(UnavailabilitiesRepository);

		const results = await repository.search({
			from: new Date(),
			to: new Date(),
			serviceId: 1,
			serviceProviderId: 2
		});

		const whereParam = "u._serviceId = :serviceId AND (u.\"_start\" <= :to AND u.\"_end\" >= :from) AND ((u.\"_allServiceProviders\" AND EXISTS(SELECT 1 FROM public.service_provider esp WHERE esp._id = :serviceProviderId AND esp._serviceId = :serviceId)) OR EXISTS(SELECT 1 FROM public.unavailable_service_provider usp WHERE usp.\"unavailability_id\" = u.\"_id\" AND usp.\"serviceProvider_id\" = :serviceProviderId))";
		expect((queryBuilderMock.where as jest.Mock).mock.calls[0][0]).toBe(whereParam);
		expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalled();
		expect(queryBuilderMock.getMany).toHaveBeenCalled();
		expect(results).toBeDefined();
	});
});

class MockDBConnection extends DbConnection {
	public static save = jest.fn();
	public static find = jest.fn();
	public static findOne = jest.fn();
	public static createQueryBuilder = jest.fn();

	public async getConnection(): Promise<any> {
		const connection = {
			getRepository: () => ({
				find: MockDBConnection.find,
				findOne: MockDBConnection.findOne,
				save: MockDBConnection.save,
				createQueryBuilder: MockDBConnection.createQueryBuilder,
			})
		};
		return Promise.resolve(connection);
	}
}
