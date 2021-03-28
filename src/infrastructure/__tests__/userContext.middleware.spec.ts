import { basePath } from '../../config/app-config';
import * as Koa from 'koa';
import { UserContextMiddleware } from '../userContext.middleware';
import { ContainerContextMiddleware } from '../containerContext.middleware';
import { Container } from 'typescript-ioc';
import { UsersService } from '../../components/users/users.service';
import { User } from '../../models';
import { UserContext } from '../auth/userContext';
import { AuthGroup } from '../auth/authGroup';
import { AnonymousCookieData, BookingSGCookieHelper } from '../bookingSGCookieHelper';

beforeAll(() => {
	Container.bind(UsersService).to(UsersServiceMock);
	Container.bind(BookingSGCookieHelper).to(BookingSGCookieHelperMock);
});

afterEach(() => {
	jest.resetAllMocks();
});

function buildSampleKoaContext(path: string): Koa.Context {
	const headers = { myHeader: 'value' };
	return {
		path,
		headers,
		request: { host: 'localhost', protocol: 'http', headers },
	} as Koa.Context;
}

describe('user Context middleware tests', () => {
	it('should get current user', async () => {
		const containerMiddleware = new ContainerContextMiddleware().build();
		const userContextMiddleware = new UserContextMiddleware().build();
		const singpassUserMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
		UsersServiceMock.getOrSaveUserFromHeaders.mockImplementation(() => Promise.resolve(singpassUserMock));

		const nextMiddleware = jest.fn().mockImplementation(async (ctx: Koa.Context, next: Koa.Next) => {
			const container = ContainerContextMiddleware.getContainerContext(ctx);
			const userContext = container.resolve(UserContext);
			const user = await userContext.getCurrentUser();
			const another = await userContext.getCurrentUser();

			expect(UsersServiceMock.getOrSaveUserFromHeaders).toBeCalledTimes(1);
			expect(user).toBeDefined();
			expect(user).toBe(another);

			return await next();
		});

		const context = buildSampleKoaContext(`${basePath}/somepath`);
		await containerMiddleware(context, () => {
			return userContextMiddleware(context, () => {
				return nextMiddleware(context, () => {});
			});
		});

		expect(nextMiddleware).toBeCalled();
	});

	it('should get anonymous user', async () => {
		const containerMiddleware = new ContainerContextMiddleware().build();
		const userContextMiddleware = new UserContextMiddleware().build();

		const cookieData = { createdAt: new Date(0), trackingId: '8db0ef50-2e3d-4eb8-83bf-16a8c9ea545f' };
		const anonymous = User.createAnonymousUser({ ...cookieData });
		BookingSGCookieHelperMock.getCookieValue.mockReturnValue(cookieData);
		UsersServiceMock.createAnonymousUserFromCookie.mockImplementation(() => Promise.resolve(anonymous));

		const nextMiddleware = jest.fn().mockImplementation(async (ctx: Koa.Context, next: Koa.Next) => {
			const container = ContainerContextMiddleware.getContainerContext(ctx);
			const userContext = container.resolve(UserContext);
			const user = await userContext.getCurrentUser();
			const another = await userContext.getCurrentUser();

			expect(UsersServiceMock.getOrSaveUserFromHeaders).toBeCalledTimes(1);
			expect(user).toBeDefined();
			expect(user).toBe(another);
			expect(user.isAnonymous()).toBe(true);

			return await next();
		});

		const context = buildSampleKoaContext(`${basePath}/somepath`);
		await containerMiddleware(context, () => {
			return userContextMiddleware(context, () => {
				return nextMiddleware(context, () => {});
			});
		});

		expect(nextMiddleware).toBeCalled();
	});

	it('should throw for user without groups', async () => {
		const containerMiddleware = new ContainerContextMiddleware().build();
		const userContextMiddleware = new UserContextMiddleware().build();
		const adminMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
		});
		UsersServiceMock.getOrSaveUserFromHeaders.mockImplementation(() => Promise.resolve(adminMock));
		UsersServiceMock.getUserGroupsFromHeaders.mockImplementation(() => Promise.resolve([]));

		const nextMiddleware = jest.fn().mockImplementation(async (ctx: Koa.Context, next: Koa.Next) => {
			const container = ContainerContextMiddleware.getContainerContext(ctx);
			const userContext = container.resolve(UserContext);
			const user = await userContext.getCurrentUser();
			const another = await userContext.getCurrentUser();

			expect(UsersServiceMock.getOrSaveUserFromHeaders).toBeCalledTimes(1);
			expect(user).toBeDefined();
			expect(user).toBe(another);

			return await next();
		});

		const context = buildSampleKoaContext(`${basePath}/somepath`);
		const asyncTest = async () => {
			await containerMiddleware(context, () => {
				return userContextMiddleware(context, () => {
					return nextMiddleware(context, () => {});
				});
			});
		};

		await expect(asyncTest).rejects.toThrowErrorMatchingInlineSnapshot(
			'"There are no user groups associated with the current user."',
		);
		expect(nextMiddleware).not.toBeCalled();
	});

	it('should throw error', async () => {
		const userContextMiddleware = new UserContextMiddleware().build();
		const singpassUserMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
		UsersServiceMock.getOrSaveUserFromHeaders.mockImplementation(() => Promise.resolve(singpassUserMock));

		const nextMiddleware = jest.fn().mockImplementation(async (ctx: Koa.Context, next: Koa.Next) => {
			return await next();
		});

		const context = buildSampleKoaContext(`${basePath}/somepath`);

		const asyncTest = async () => {
			return await userContextMiddleware(context, () => {
				return nextMiddleware(context, () => {});
			});
		};

		await expect(asyncTest).rejects.toThrowError();
	});
});

class UsersServiceMock implements Partial<UsersService> {
	public static createAnonymousUserFromCookie = jest.fn<Promise<User>, any>();
	public static getOrSaveUserFromHeaders = jest.fn<Promise<User>, any>();
	public static getUserGroupsFromHeaders = jest.fn<Promise<AuthGroup[]>, any>();

	public async createAnonymousUserFromCookie(...params): Promise<any> {
		return await UsersServiceMock.createAnonymousUserFromCookie(...params);
	}

	public async getOrSaveUserFromHeaders(...params): Promise<any> {
		return await UsersServiceMock.getOrSaveUserFromHeaders(...params);
	}

	public async getUserGroupsFromHeaders(...params): Promise<any> {
		return await UsersServiceMock.getUserGroupsFromHeaders(...params);
	}
}

class BookingSGCookieHelperMock implements Partial<BookingSGCookieHelper> {
	public static getCookieValue = jest.fn<AnonymousCookieData | undefined, any>();

	public getCookieValue(): AnonymousCookieData | undefined {
		return BookingSGCookieHelperMock.getCookieValue();
	}
}
