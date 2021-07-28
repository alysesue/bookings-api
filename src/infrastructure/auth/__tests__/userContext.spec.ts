import { ContainerContextHolder } from '../../containerContext';
import { Container } from 'typescript-ioc';
import { UsersService } from '../../../components/users/users.service';
import { User } from '../../../models';
import { UserContext } from '../../auth/userContext';
import { AnonymousAuthGroup, CitizenAuthGroup } from '../../auth/authGroup';
import * as uuid from 'uuid';
import { UsersServiceMock } from '../../../components/users/__mocks__/users.service';

// We need jest.requireActual(...) because userContext is mocked globally in globalmocks.ts
// Here, we need the actual implementation to test
jest.mock('../../auth/userContext', () => {
	return jest.requireActual('../../auth/userContext');
});

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

	it('should get anonymous user', async () => {
		const data = { createdAt: new Date(), trackingId: uuid.v4() };

		const anonymous = User.createAnonymousUser(data);
		const scope = ContainerContextHolder.create();
		const userContext = scope.resolve(UserContext);

		userContext.setAnonymousUser(data);

		UsersServiceMock.getAnonymousUserRoles.mockReturnValue(Promise.resolve([new AnonymousAuthGroup(anonymous)]));

		UsersServiceMock.createAnonymousUserFromCookie.mockReturnValue(Promise.resolve(anonymous));
		const user = await userContext.getCurrentUser();
		const groups = await userContext.getAuthGroups();

		expect(UsersServiceMock.createAnonymousUserFromCookie).toHaveBeenCalled();
		expect(UsersServiceMock.getAnonymousUserRoles).toBeCalled();
		expect(user).toStrictEqual(anonymous);
		expect(groups).toStrictEqual([new AnonymousAuthGroup(anonymous)]);
	});
});
