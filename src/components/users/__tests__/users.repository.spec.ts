import { User } from "../../../models";
import { Container } from "typescript-ioc";
import { UsersRepository } from "../users.repository";
import { CreateQueryBuilder, InnerRepositoryMock, TransactionManagerMock } from '../../../infrastructure/tests/dbconnectionmock';
import { TransactionManager } from "../../../core/transactionManager";

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
});

const userMock = new User();
userMock.id = 1;

describe("User repository", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should save user", async () => {
		const saveResult = [{ id: "abc" }];
		InnerRepositoryMock.save.mockImplementation(() => saveResult);
		const userRepository = Container.get(UsersRepository);

		const result = await userRepository.save({} as User);
		expect(result).toStrictEqual([{ id: "abc" }]);
	});

	it('should getUserByMolUserId', async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve([userMock])),
		};
		CreateQueryBuilder.mockImplementation(() => queryBuilderMock);
		const userRepository = Container.get(UsersRepository);

		const result = await userRepository.getUserByMolUserId("d080f6ed-3b47-478a-a6c6-dfb5608a199d");
		expect(result).toStrictEqual([userMock]);
	});

	it('should getUserByMolAdminId', async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve([userMock])),
		};
		CreateQueryBuilder.mockImplementation(() => queryBuilderMock);
		const userRepository = Container.get(UsersRepository);

		const result = await userRepository.getUserByMolAdminId("d080f6ed-3b47-478a-a6c6-dfb5608a199d");
		expect(result).toStrictEqual([userMock]);
	});
});
