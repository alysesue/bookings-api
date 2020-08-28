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
		Container.bind(DbConnection).to(MockDBConnection);
		jest.resetAllMocks();
	});

	it("should save user", async () => {
		const saveResult = [{ id: "abc" }];
		MockDBConnection.save.mockImplementation(() => saveResult);
		const userRepository = Container.get(UsersRepository);

		const result = await userRepository.save({} as User);
		expect(result).toStrictEqual([{ id: "abc" }]);
	});

	it('Should call createQueryBuilder', async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve([userMock])),
		};
		MockDBConnection.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		const userRepository = Container.get(UsersRepository);

		const result = await userRepository.getUserByMolUserId("molUserId");
		expect(result).toStrictEqual([userMock]);
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
