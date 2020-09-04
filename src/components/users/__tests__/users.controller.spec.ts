import { Container } from 'typescript-ioc';
import { UsersController } from '../users.controller';
import { MOLSecurityHeaderKeys } from 'mol-lib-api-contract/auth/common/mol-security-headers';
import { MOLAuthType } from 'mol-lib-api-contract/auth/common/MOLAuthType';
import { UserContext } from '../../../infrastructure/userContext.middleware';
import { User } from '../../../models';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(UserContext).to(UserContextMock);
});

afterEach(() => {
	jest.resetAllMocks();
});

describe('users controller', () => {
	it('should get user profile', async () => {
		const headers = {
			[MOLSecurityHeaderKeys.AUTH_TYPE]: MOLAuthType.USER,
			[MOLSecurityHeaderKeys.USER_AUTH_LEVEL]: 2,
			[MOLSecurityHeaderKeys.USER_ID]: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			[MOLSecurityHeaderKeys.USER_UINFIN]: 'ABC1234',
		};

		const userMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(userMock));

		const controller = Container.get(UsersController);
		(controller as any).context = {
			headers,
			request: { headers },
		};

		const profile = await controller.getProfile();
		expect(profile).toBeDefined();
	});

	it('should get admin profile', async () => {
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
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(userMock));

		const controller = Container.get(UsersController);
		(controller as any).context = {
			headers,
			request: { headers },
		};

		const profile = await controller.getProfile();
		expect(profile).toBeDefined();
	});

	it('should not get profile', async () => {
		const controller = Container.get(UsersController);

		const headers = {};
		(controller as any).context = { headers };

		const test = async () => await controller.getProfile();
		await expect(test).rejects.toThrowError();
	});
});

class UserContextMock extends UserContext {
	public static getCurrentUser = jest.fn();

	public init() {}
	public async getCurrentUser(...params): Promise<any> {
		return await UserContextMock.getCurrentUser(params);
	}
}
