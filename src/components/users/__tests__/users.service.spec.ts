import { Container } from 'typescript-ioc';
import { User } from '../../../models';
import { UsersRepository } from '../users.repository';
import { UsersService } from '../users.service';
import { MOLSecurityHeaderKeys } from 'mol-lib-api-contract/auth/common/mol-security-headers';
import { MOLAuthType } from 'mol-lib-api-contract/auth/common/MOLAuthType';

beforeAll(() => {
	Container.bind(UsersRepository).to(UserRepositoryMock);
});

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('Users Service', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should return singpass user', async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.USER;
		headers[MOLSecurityHeaderKeys.USER_ID] = 'd080f6ed-3b47-478a-a6c6-dfb5608a199d';
		headers[MOLSecurityHeaderKeys.USER_UINFIN] = 'ABC1234';

		const userMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
		UserRepositoryMock.getUserByMolUserId.mockImplementation(() => Promise.resolve(userMock));

		const service = Container.get(UsersService);
		const user = await service.getOrSaveUserFromHeaders(headers);
		expect(UserRepositoryMock.getUserByMolUserId).toBeCalled();
		expect(user.singPassUser).toBeDefined();
	});

	it('should validate singpass user', async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.USER;

		const userMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
		UserRepositoryMock.getUserByMolUserId.mockImplementation(() => Promise.resolve(userMock));

		const service = Container.get(UsersService);
		const test = async () => await service.getOrSaveUserFromHeaders(headers);
		await expect(test).rejects.toThrowError();
	});

	it("should save if user doesn't exist", async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.USER;
		headers[MOLSecurityHeaderKeys.USER_ID] = 'd080f6ed-3b47-478a-a6c6-dfb5608a199d';
		headers[MOLSecurityHeaderKeys.USER_UINFIN] = 'ABC1234';

		UserRepositoryMock.getUserByMolUserId.mockImplementation(() => Promise.resolve(null));
		UserRepositoryMock.save.mockImplementation((entry) => Promise.resolve(entry));

		const service = Container.get(UsersService);
		const user = await service.getOrSaveUserFromHeaders(headers);
		expect(UserRepositoryMock.getUserByMolUserId).toBeCalled();
		expect(UserRepositoryMock.save).toBeCalled();
		expect(user.singPassUser).toBeDefined();
	});

	it('should return admin user', async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.ADMIN;
		headers[MOLSecurityHeaderKeys.ADMIN_ID] = 'd080f6ed-3b47-478a-a6c6-dfb5608a199d';
		headers[MOLSecurityHeaderKeys.ADMIN_USERNAME] = 'UserName';
		headers[MOLSecurityHeaderKeys.ADMIN_EMAIL] = 'test@email.com';
		headers[MOLSecurityHeaderKeys.ADMIN_NAME] = 'Name';

		const userMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
		});

		UserRepositoryMock.getUserByMolAdminId.mockImplementation(() => Promise.resolve(userMock));

		const service = Container.get(UsersService);
		const user = await service.getOrSaveUserFromHeaders(headers);
		expect(UserRepositoryMock.getUserByMolAdminId).toBeCalled();
		expect(user.adminUser).toBeDefined();
	});

	it('should validate admin user', async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.ADMIN;

		const userMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
		UserRepositoryMock.getUserByMolAdminId.mockImplementation(() => Promise.resolve(userMock));
		const service = Container.get(UsersService);
		const test = async () => await service.getOrSaveUserFromHeaders(headers);
		await expect(test).rejects.toThrowError();
	});

	it('should return null user', async () => {
		const headers = {};
		const service = Container.get(UsersService);
		const user = await service.getOrSaveUserFromHeaders(headers);
		expect(user).toBeNull();
	});

	it('should return null user', async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = 'NEW_TYPE';
		const service = Container.get(UsersService);
		const test = async () => await service.getOrSaveUserFromHeaders(headers);

		await expect(test).rejects.toThrowError();
	});
});

class UserRepositoryMock extends UsersRepository {
	public static save = jest.fn();
	public static getUserByMolUserId = jest.fn();
	public static getUserByMolAdminId = jest.fn();

	public async save(...params): Promise<any> {
		return await UserRepositoryMock.save(...params);
	}

	public async getUserByMolUserId(...params): Promise<any> {
		return await UserRepositoryMock.getUserByMolUserId(...params);
	}

	public async getUserByMolAdminId(...params): Promise<any> {
		return await UserRepositoryMock.getUserByMolAdminId(...params);
	}
}
