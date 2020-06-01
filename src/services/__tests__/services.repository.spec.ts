import { ServicesRepository } from "../services.repository";
import { DbConnection } from "../../core/db.connection";
import { Container } from "typescript-ioc";
import { Service } from "../../models";

describe("Services repository", () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it("should get list of services", async () => {
		Container.bind(DbConnection).to(MockDBConnection);
		MockDBConnection.find.mockImplementation(() => Promise.resolve([]));

		const repository = Container.get(ServicesRepository);
		const result = await repository.getAll();
		expect(result).toStrictEqual([]);
	});

	it("should save a service", async () => {
		const service: Service = new Service();
		service.name = "Coaches";

		Container.bind(DbConnection).to(MockDBConnection);
		MockDBConnection.save.mockImplementation(() => Promise.resolve(service));
		const repository = Container.get(ServicesRepository);

		await repository.save(service);
		expect(MockDBConnection.save.mock.calls[0][0]).toStrictEqual(service)
	});

});

class MockDBConnection extends DbConnection {
	public static save = jest.fn();
	public static find = jest.fn();

	public async getConnection(): Promise<any> {
		const connection = {
			getRepository: () => ({
				find: MockDBConnection.find,
				save: MockDBConnection.save,
			})
		};
		return Promise.resolve(connection);
	}
}
