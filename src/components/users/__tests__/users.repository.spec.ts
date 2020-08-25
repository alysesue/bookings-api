import { User } from "../../../models";
import { Container } from "typescript-ioc";
import { DbConnection } from "../../../core/db.connection";
import { UsersRepository } from "../users.repository";

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

const userMock = new User();

describe("User repository", () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it("should save user", async () => {
		Container.bind(DbConnection).to(MockDBConnection);
		const saveResult = [{ id: "abc" }];
		MockDBConnection.save.mockImplementation(() => saveResult);
		const userRepository = Container.get(UsersRepository);

		const result = await userRepository.save({} as User);
		expect(result).toStrictEqual([{ id: "abc" }]);
	});
});

class MockDBConnection extends DbConnection {
	public static insert = jest.fn();
	public static find = jest.fn();
	public static update = jest.fn();
	public static findOne = jest.fn();
	public static save = jest.fn();
	public static createQueryBuilder = jest.fn();

	public async getConnection(): Promise<any> {
		const connection = {
			getRepository: () => ({
				find: MockDBConnection.find,
				findOne: MockDBConnection.findOne,
				insert: MockDBConnection.insert,
				update: MockDBConnection.update,
				save: MockDBConnection.save,
				createQueryBuilder: MockDBConnection.createQueryBuilder,
			}),
		};
		return Promise.resolve(connection);
	}
}
