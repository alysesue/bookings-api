import { ContainerContextHolder } from '../../containerContext.middleware';
import { Container } from 'typescript-ioc';
import { UsersService } from '../../../components/users/users.service';
import { User } from '../../../models';
import { UserContext } from '../../auth/userContext';
import { AuthGroup, CitizenAuthGroup } from '../../auth/authGroup';

beforeAll(() => {
	Container.bind(UsersService).to(UsersServiceMock);

	ContainerContextHolder.registerInContainer();
});

afterEach(() => {
	jest.resetAllMocks();
});

describe('User Context tests', () => {
	it('should get null user', async () => {
		UsersServiceMock.getOrSaveUserFromHeaders.mockImplementation(() => Promise.resolve(null));

		const scope = ContainerContextHolder.create();
		const userContext = scope.resolve(UserContext);
		const user = await userContext.getCurrentUser();
		const groups = await userContext.getAuthGroups();

		expect(UsersServiceMock.getOrSaveUserFromHeaders).toHaveBeenCalled();
		expect(user).toBeNull();
		expect(groups).toStrictEqual([]);
	});

	it('should get citizen user', async () => {
		const singpassUserMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
		UsersServiceMock.getOrSaveUserFromHeaders.mockImplementation(() => Promise.resolve(singpassUserMock));

		const scope = ContainerContextHolder.create();
		const userContext = scope.resolve(UserContext);
		const user = await userContext.getCurrentUser();
		const groups = await userContext.getAuthGroups();

		expect(UsersServiceMock.getOrSaveUserFromHeaders).toHaveBeenCalled();
		expect(user).toBe(singpassUserMock);
		expect(groups[0] instanceof CitizenAuthGroup).toBe(true);
	});

	it('should get admin user', async () => {
		const adminMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
			agencyUserId: 'ABC123',
		});

		UsersServiceMock.getOrSaveUserFromHeaders.mockImplementation(() => Promise.resolve(adminMock));
		UsersServiceMock.getUserGroupsFromHeaders.mockImplementation(() => Promise.resolve([]));

		const scope = ContainerContextHolder.create();
		const userContext = scope.resolve(UserContext);
		const user = await userContext.getCurrentUser();
		const groups = await userContext.getAuthGroups();

		expect(UsersServiceMock.getOrSaveUserFromHeaders).toHaveBeenCalled();
		expect(UsersServiceMock.getUserGroupsFromHeaders).toHaveBeenCalled();
		expect(user).toBe(adminMock);
		expect(groups).toStrictEqual([]);
	});
});

class UsersServiceMock extends UsersService {
	public static getOrSaveUserFromHeaders = jest.fn<Promise<User>, any>();
	public static getUserGroupsFromHeaders = jest.fn<Promise<AuthGroup[]>, any>();

	public async getOrSaveUserFromHeaders(...params): Promise<any> {
		return await UsersServiceMock.getOrSaveUserFromHeaders(...params);
	}

	public async getUserGroupsFromHeaders(...params): Promise<any> {
		return await UsersServiceMock.getUserGroupsFromHeaders(...params);
	}
}
