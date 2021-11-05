import * as Koa from 'koa';
import { CreateCsrfMiddleware, JWTCsrf, VerifyCsrfMiddleware } from '../csrf.middleware';
import * as Cookies from 'cookies';
import { JwtUtils } from 'mol-lib-common';
import { ContainerContextMiddleware } from '../containerContext.middleware';
import { Container } from 'typescript-ioc';
import { UserContext } from '../auth/userContext';
import { User } from '../../models';
import { AuthGroup } from '../auth/authGroup';
import * as uuid from 'uuid';
import { getConfig } from '../../config/app-config';

jest.mock('../../config/app-config');

// mol-lib-common is globally mocked, we need the real module here.
jest.mock('mol-lib-common', () => {
	return jest.requireActual('mol-lib-common');
});

beforeAll(() => {
	Container.bind(UserContext).to(UserContextMock);
});

// tslint:disable-next-line: no-big-function
describe('Test csrf middleware', () => {
	const containerMiddleware = new ContainerContextMiddleware().build();
	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
		agencyUserId: 'ABC123',
	});
	adminMock.id = 2;

	const anonymousUser = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });

	const context = {
		set: jest.fn() as (e: { [key: string]: string | string[] }) => void,
		get: jest.fn() as (field: string) => string,
		cookies: {
			set: jest.fn(),
			get: jest.fn(),
		} as Partial<Cookies>,
		status: undefined,
	} as Koa.Context;

	beforeEach(() => {
		jest.resetAllMocks();
		context.request = {
			method: '',
		} as Partial<Request> as any;

		UserContextMock.getCurrentUser.mockReturnValue(Promise.resolve(adminMock));
		(getConfig as jest.Mock).mockReturnValue({
			isLocal: false,
			csrfSecret: 'f0JuxiT87QYtd-5yGxQk5SIX5Mz1tMTGhuKRHyXCvYA',
			isAutomatedTest: false,
		});
	});

	it('should generate jose secret', async () => {
		const secret = await JwtUtils.generateSecret();
		expect(secret).toBeDefined();
	});

	it('should encrypt and decrypt JWE', async () => {
		const someKey = await JwtUtils.generateSecret();
		const jwtKey = await JwtUtils.createSymmetricKey(someKey);
		const payload = { a: 1, b: 5 };
		const encrypted = await JwtUtils.encryptJwe(jwtKey, JSON.stringify(payload));

		const result = await JwtUtils.decryptJwe(jwtKey, encrypted);
		const decrypted = JSON.parse(result.payload.toString('utf8'));
		expect(decrypted).toEqual(payload);
	});

	it('Should create token', async () => {
		context.request.method = 'HEAD';

		const nextMiddleware: Koa.Next = jest.fn(() => Promise.resolve());
		const handler = new CreateCsrfMiddleware();
		const middleware = handler.build();
		await containerMiddleware(context, async () => {
			await middleware(context, nextMiddleware);
		});

		expect(context.cookies.set).toHaveBeenCalled();
	});

	it('Should create token (when in DEV)', async () => {
		context.request.method = 'HEAD';
		(getConfig as jest.Mock).mockReturnValue({
			isLocal: true,
			csrfSecret: 'f0JuxiT87QYtd-5yGxQk5SIX5Mz1tMTGhuKRHyXCvYA',
			isAutomatedTest: false,
		});

		const nextMiddleware: Koa.Next = jest.fn(() => Promise.resolve());
		const handler = new CreateCsrfMiddleware();
		const middleware = handler.build();
		await containerMiddleware(context, async () => {
			await middleware(context, nextMiddleware);
		});

		expect(context.cookies.set).toHaveBeenCalled();
		expect(context.status).toBe(204);
	});

	it('Should return 204 for HEAD requests (when automated tests = true)', async () => {
		context.request.method = 'HEAD';
		(getConfig as jest.Mock).mockReturnValue({
			isLocal: true,
			csrfSecret: 'f0JuxiT87QYtd-5yGxQk5SIX5Mz1tMTGhuKRHyXCvYA',
			isAutomatedTest: true,
		});

		const nextMiddleware: Koa.Next = jest.fn(() => Promise.resolve());
		const handler = new CreateCsrfMiddleware();
		const middleware = handler.build();
		await containerMiddleware(context, async () => {
			await middleware(context, nextMiddleware);
		});

		expect(context.status).toBe(204);
		expect(nextMiddleware as jest.Mock).not.toBeCalledTimes(1);
	});

	it('Should create token for anonymous user', async () => {
		context.request.method = 'HEAD';

		UserContextMock.getCurrentUser.mockReturnValue(Promise.resolve(anonymousUser));
		const nextMiddleware: Koa.Next = jest.fn(() => Promise.resolve());
		const handler = new CreateCsrfMiddleware();
		const middleware = handler.build();
		await containerMiddleware(context, async () => {
			await middleware(context, nextMiddleware);
		});

		expect(context.cookies.set).toHaveBeenCalled();
		expect(context.status).toBe(204);
	});

	it('Should create token for null user', async () => {
		context.request.method = 'HEAD';

		UserContextMock.getCurrentUser.mockReturnValue(Promise.resolve(null));
		const nextMiddleware: Koa.Next = jest.fn(() => Promise.resolve());
		const handler = new CreateCsrfMiddleware();
		const middleware = handler.build();
		await containerMiddleware(context, async () => {
			await middleware(context, nextMiddleware);
		});

		expect(context.cookies.set).toHaveBeenCalled();
	});

	it('Should validate current context', async () => {
		context.request.method = 'post';
		const createCsrf = new CreateCsrfMiddleware();
		const expiryDate = new Date(new Date().getTime() + 60 * 1000);
		const sampleToken: JWTCsrf = {
			type: 'cookie',
			uuid: '1',
			cookieName: 'name',
			trackingId: adminMock.getTrackingId(),
			expiryDate,
		};
		const jwtCookie = await createCsrf.createJwtToken(sampleToken);
		const jwtHeader = await createCsrf.createJwtToken({ ...sampleToken, type: 'header' });

		(context.cookies.get as jest.Mock).mockReturnValue(jwtCookie);
		(context.get as jest.Mock).mockReturnValue(jwtHeader);

		const nextMiddleware: Koa.Next = jest.fn(() => Promise.resolve());
		const handler = new VerifyCsrfMiddleware();
		const middleware = handler.build();
		await containerMiddleware(context, async () => {
			await middleware(context, nextMiddleware);
		});
		expect(nextMiddleware as jest.Mock).toBeCalledTimes(1);
	});

	it('Should validate context for null user', async () => {
		context.request.method = 'post';
		UserContextMock.getCurrentUser.mockReturnValue(Promise.resolve(null));

		const createCsrf = new CreateCsrfMiddleware();
		const expiryDate = new Date(new Date().getTime() + 60 * 1000);
		const sampleToken: JWTCsrf = {
			type: 'cookie',
			uuid: '1',
			cookieName: 'name',
			trackingId: 'none',
			expiryDate,
		};
		const jwtCookie = await createCsrf.createJwtToken(sampleToken);
		const jwtHeader = await createCsrf.createJwtToken({ ...sampleToken, type: 'header' });

		(context.cookies.get as jest.Mock).mockReturnValue(jwtCookie);
		(context.get as jest.Mock).mockReturnValue(jwtHeader);

		const nextMiddleware: Koa.Next = jest.fn(() => Promise.resolve());
		const handler = new VerifyCsrfMiddleware();
		const middleware = handler.build();
		await containerMiddleware(context, async () => {
			await middleware(context, nextMiddleware);
		});
		expect(nextMiddleware as jest.Mock).toBeCalledTimes(1);
	});

	it('Should not validate context with wrong uuid', async () => {
		context.request.method = 'post';
		const createCsrf = new CreateCsrfMiddleware();
		const expiryDate = new Date(new Date().getTime() + 60 * 1000);
		const sampleCookie: JWTCsrf = {
			type: 'cookie',
			uuid: '1',
			cookieName: 'name',
			trackingId: adminMock.getTrackingId(),
			expiryDate,
		};

		const jwtCookie = await createCsrf.createJwtToken(sampleCookie);
		const jwtHeader = await createCsrf.createJwtToken({ ...sampleCookie, type: 'header', uuid: '22' });

		(context.cookies.get as jest.Mock).mockReturnValue(jwtCookie);
		(context.get as jest.Mock).mockReturnValue(jwtHeader);
		const nextMiddleware: Koa.Next = jest.fn(() => Promise.resolve());
		const handler = new VerifyCsrfMiddleware();
		const middleware = handler.build();

		const test = async () => {
			await containerMiddleware(context, async () => {
				await middleware(context, nextMiddleware);
			});
		};

		await expect(test).rejects.toMatchInlineSnapshot('[SYS_INVALID_PARAM (400): Invalid csrf token]');
		expect(nextMiddleware as jest.Mock).toBeCalledTimes(0);
	});

	it('Should not validate context with wrong user tracking', async () => {
		context.request.method = 'post';
		const createCsrf = new CreateCsrfMiddleware();
		const expiryDate = new Date(new Date().getTime() + 60 * 1000);
		const sampleCookie: JWTCsrf = {
			type: 'cookie',
			uuid: '1',
			cookieName: 'name',
			trackingId: 'some tracking',
			expiryDate,
		};

		const jwtCookie = await createCsrf.createJwtToken(sampleCookie);
		const jwtHeader = await createCsrf.createJwtToken({ ...sampleCookie, type: 'header' });

		(context.cookies.get as jest.Mock).mockReturnValue(jwtCookie);
		(context.get as jest.Mock).mockReturnValue(jwtHeader);
		const nextMiddleware: Koa.Next = jest.fn(() => Promise.resolve());
		const handler = new VerifyCsrfMiddleware();
		const middleware = handler.build();

		const test = async () => {
			await containerMiddleware(context, async () => {
				await middleware(context, nextMiddleware);
			});
		};

		await expect(test).rejects.toMatchInlineSnapshot('[SYS_INVALID_PARAM (400): Invalid csrf token]');
		expect(nextMiddleware as jest.Mock).toBeCalledTimes(0);
	});

	it('Should not validate context with expired token', async () => {
		context.request.method = 'post';
		const createCsrf = new CreateCsrfMiddleware();
		const expiryDate = new Date(new Date().getTime() - 60 * 1000);
		const sampleCookie: JWTCsrf = {
			type: 'cookie',
			uuid: '1',
			cookieName: 'name',
			trackingId: 'some tracking',
			expiryDate,
		};

		const jwtCookie = await createCsrf.createJwtToken(sampleCookie);
		const jwtHeader = await createCsrf.createJwtToken({ ...sampleCookie, type: 'header' });

		(context.cookies.get as jest.Mock).mockReturnValue(jwtCookie);
		(context.get as jest.Mock).mockReturnValue(jwtHeader);
		const nextMiddleware: Koa.Next = jest.fn(() => Promise.resolve());
		const handler = new VerifyCsrfMiddleware();
		const middleware = handler.build();

		const test = async () => {
			await containerMiddleware(context, async () => {
				await middleware(context, nextMiddleware);
			});
		};

		await expect(test).rejects.toMatchInlineSnapshot('[SYS_INVALID_PARAM (400): Invalid csrf token]');
		expect(nextMiddleware as jest.Mock).toBeCalledTimes(0);
	});
});

class UserContextMock implements Partial<UserContext> {
	public static getCurrentUser = jest.fn<Promise<User>, any>();
	public static getAuthGroups = jest.fn<Promise<AuthGroup[]>, any>();

	public init() {}
	public async getCurrentUser(...params): Promise<any> {
		return await UserContextMock.getCurrentUser(...params);
	}

	public async getAuthGroups(...params): Promise<any> {
		return await UserContextMock.getAuthGroups(...params);
	}
}
