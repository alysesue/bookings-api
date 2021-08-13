import { OtpServiceMock } from './../../components/otp/__mocks__/otp.service.mock';
import { OtpService } from './../../components/otp/otp.service';
import { basePath } from '../../config/app-config';
import * as Koa from 'koa';
import { UserContextMiddleware } from '../userContext.middleware';
import { ContainerContextMiddleware } from '../containerContext.middleware';
import { Container } from 'typescript-ioc';
import { UsersService } from '../../components/users/users.service';
import { User } from '../../models';
import { UserContext } from '../auth/userContext';
import { AnonymousCookieData, BookingSGCookieHelper, MobileOtpCookieHelper } from '../bookingSGCookieHelper';
import { UsersServiceMock } from '../../components/users/__mocks__/users.service';
import { AnonymousAuthGroup } from '../auth/authGroup';
import { MobileOtpCookieHelperMock } from '../__mocks__/mobileOtpCookieHelper.mock';

// We need jest.requireActual(...) because userContext is mocked globally in globalmocks.ts
// Here, we need the actual implementation to test
jest.mock('../auth/userContext', () => {
	return jest.requireActual('../auth/userContext');
});

beforeAll(() => {
	Container.bind(UsersService).to(UsersServiceMock);
	Container.bind(BookingSGCookieHelper).to(BookingSGCookieHelperMock);
	Container.bind(MobileOtpCookieHelper).to(MobileOtpCookieHelperMock);
	Container.bind(OtpService).to(OtpServiceMock);
});

afterEach(() => {
	jest.resetAllMocks();
});

function buildSampleKoaContext(path: string): Koa.Context {
	const headers = { myHeader: 'value' };
	return ({
		path,
		headers,
		request: { host: 'localhost', protocol: 'http', headers },
	} as unknown) as Koa.Context;
}

describe('user Context middleware tests', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

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
		const mobileOtpAddOnCookieData = {
			cookieCreatedAt: new Date(0),
			otpReqId: 'f08c64ae-6d97-4d36-92a8-c6c1f190a676',
		};
		MobileOtpCookieHelperMock.getCookieValue.mockReturnValue(mobileOtpAddOnCookieData);
		OtpServiceMock.getMobileNoMock.mockReturnValue(Promise.resolve('+6588884444'));

		UsersServiceMock.createAnonymousUserFromCookie.mockImplementation(() => Promise.resolve(anonymous));
		UsersServiceMock.getAnonymousUserRoles.mockReturnValue(Promise.resolve([new AnonymousAuthGroup(anonymous)]));

		const nextMiddleware = jest.fn().mockImplementation(async (ctx: Koa.Context, next: Koa.Next) => {
			const container = ContainerContextMiddleware.getContainerContext(ctx);
			const userContext = container.resolve(UserContext);
			const user = await userContext.getCurrentUser();
			const another = await userContext.getCurrentUser();
			const otpAddOnMobileNo = userContext.getOtpAddOnMobileNo();

			expect(UsersServiceMock.getOrSaveUserFromHeaders).toBeCalledTimes(1);
			expect(UsersServiceMock.getAnonymousUserRoles).toBeCalled();
			expect(user).toBeDefined();
			expect(user).toBe(another);
			expect(user.isAnonymous()).toBe(true);
			expect(otpAddOnMobileNo).toBe('+6588884444');

			return await next();
		});

		const context = buildSampleKoaContext(`${basePath}/somepath`);
		await containerMiddleware(context, async () => {
			return await userContextMiddleware(context, async () => {
				return await nextMiddleware(context, () => {});
			});
		});

		expect(nextMiddleware).toBeCalled();
	});

	// TODO: enable test
	// it('should throw error for anonymous user without OtpAddOn cookie', async () => {
	// 	const containerMiddleware = new ContainerContextMiddleware().build();
	// 	const userContextMiddleware = new UserContextMiddleware().build();

	// 	const cookieData = { createdAt: new Date(0), trackingId: '8db0ef50-2e3d-4eb8-83bf-16a8c9ea545f' };
	// 	const anonymous = User.createAnonymousUser({ ...cookieData });
	// 	BookingSGCookieHelperMock.getCookieValue.mockReturnValue(cookieData);
	// 	MobileOtpCookieHelperMock.getCookieValue.mockReturnValue(undefined);

	// 	UsersServiceMock.createAnonymousUserFromCookie.mockImplementation(() => Promise.resolve(anonymous));
	// 	UsersServiceMock.getAnonymousUserRoles.mockReturnValue(Promise.resolve([new AnonymousAuthGroup(anonymous)]));

	// 	const nextMiddleware = jest.fn().mockImplementation(async (ctx: Koa.Context, next: Koa.Next) => {
	// 		const container = ContainerContextMiddleware.getContainerContext(ctx);
	// 		const userContext = container.resolve(UserContext);
	// 		const user = await userContext.getCurrentUser();
	// 		const another = await userContext.getCurrentUser();

	// 		expect(UsersServiceMock.getOrSaveUserFromHeaders).toBeCalledTimes(1);
	// 		expect(UsersServiceMock.getAnonymousUserRoles).toBeCalled();
	// 		expect(user).toBeDefined();
	// 		expect(user).toBe(another);
	// 		expect(user.isAnonymous()).toBe(true);

	// 		return await next();
	// 	});

	// 	const context = buildSampleKoaContext(`${basePath}/somepath`);
	// 	const asyncTest = async () => {
	// 		await containerMiddleware(context, () => {
	// 			return userContextMiddleware(context, () => {
	// 				return nextMiddleware(context, () => {});
	// 			});
	// 		});
	// 	};

	// 	await expect(asyncTest).rejects.toThrowErrorMatchingInlineSnapshot(
	// 		'"User is not authenticated with mobile otp"',
	// 	);
	// 	expect(nextMiddleware).not.toBeCalled();
	// });

	it('should throw error for user without groups', async () => {
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

		await expect(asyncTest).rejects.toThrowErrorMatchingInlineSnapshot(
			'"ContainerContextHolder not found in koa context. [ContainerContextMiddleware] needs to be registered in Koa pipeline."',
		);
	});
});

class BookingSGCookieHelperMock implements Partial<BookingSGCookieHelper> {
	public static getCookieValue = jest.fn<AnonymousCookieData | undefined, any>();

	public getCookieValue(): AnonymousCookieData | undefined {
		return BookingSGCookieHelperMock.getCookieValue();
	}
}
