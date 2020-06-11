import { ServiceProvidersRepository } from "../serviceProviders.repository";
import { DbConnection } from "../../core/db.connection";
import { Container } from "typescript-ioc";
import { Service, ServiceProvider } from "../../models";

describe("Service Provider repository", () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it("should get list of SP", async () => {
		Container.bind(DbConnection).to(MockDBConnection);
		Container.bindName('config').to({ service: new Service() });
		MockDBConnection.find.mockImplementation(() => Promise.resolve([]));

		const spRepository = Container.get(ServiceProvidersRepository);
		const result = await spRepository.getServiceProviders(1);
		expect(result).toStrictEqual([]);
	});

	it("should get a service provider", async () => {
		Container.bind(DbConnection).to(MockDBConnection);
		MockDBConnection.findOne.mockImplementation(() => Promise.resolve({ name: "Monica" }));

		const spRepository = Container.get(ServiceProvidersRepository);
		const result = await spRepository.getServiceProvider(1);

		expect(result).toStrictEqual({ name: "Monica" });
	});

	it("should save multiple SPs", async () => {
		const spInput: ServiceProvider = new ServiceProvider("abc", null, 1);

		Container.bind(DbConnection).to(MockDBConnection);
		MockDBConnection.save.mockImplementation(() => Promise.resolve(spInput));
		const spRepository = Container.get(ServiceProvidersRepository);

		const result = await spRepository.save(spInput);
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
