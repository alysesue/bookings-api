import { Container } from "typescript-ioc";
import { User } from "../../../models";
import { UsersRepository } from "../users.repository";
import { UsersService } from "../users.service";

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe("Users Service", () => {
	beforeAll(() => {
		Container.bind(UsersRepository).to(UserRepositoryMock);
		UserRepositoryMock.user = User.createSingPassUser('mol', 'uinfin');
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it("should return undefined user", async () => {
		UserRepositoryMock.firstPromiseUserByMolUserId = Promise.resolve(UserRepositoryMock.user);
		const user = await Container.get(UsersService).save(User.createSingPassUser('id', 'uinFin'));
		expect(user).toBe(UserRepositoryMock.user);
	});

	it("should catch error undefined user", async () => {
		UserRepositoryMock.firstPromiseUserByMolUserId = Promise.resolve(undefined);
		UserRepositoryMock.promiseSave = Promise.reject(undefined);
		UserRepositoryMock.promiseUserByMolUserId = Promise.resolve(UserRepositoryMock.user);
		const user = await Container.get(UsersService).save(User.createSingPassUser('id', 'uinFin'));
		expect(user).toBe(UserRepositoryMock.user);
		expect(UserRepositoryMock.nbGetUserByMolUserIdCalled).toBe(2);
	});

	it("should return undefined user", async () => {
		const user = await Container.get(UsersService).save(undefined);
		expect(user).toBe(undefined);
	});
});

class UserRepositoryMock extends UsersRepository {
	public static user: User;
	public static firstPromiseUserByMolUserId: Promise<User>;
	public static promiseUserByMolUserId: Promise<User>;
	public static promiseSave: Promise<User>;

	public static nbGetUserByMolUserIdCalled = 0;
	public async getUserByMolUserId(id: string): Promise<User> {
		UserRepositoryMock.nbGetUserByMolUserIdCalled++;
		if (UserRepositoryMock.nbGetUserByMolUserIdCalled === 1)
			return UserRepositoryMock.firstPromiseUserByMolUserId;
		else
			return UserRepositoryMock.promiseUserByMolUserId;
	}

	public async save(user: User): Promise<User> {
		return UserRepositoryMock.promiseSave;
	}
}

