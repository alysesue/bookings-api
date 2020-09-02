import { basePath } from "../../config/app-config";
import * as Koa from "koa";
import { UserContext, UserContextMiddleware } from '../userContext.middleware';
import { ContainerContextMiddleware } from "../containerContext.middleware";
import { Container } from "typescript-ioc";
import { UsersService } from "../../components/users/users.service";
import { User } from "../../models";


beforeAll(() => {
	Container.bind(UsersService).to(UsersServiceMock);
});

afterEach(() => {
	jest.resetAllMocks();
});

function buildSampleKoaContext(path: string): Koa.Context {
	const headers = { myHeader: 'value' };
	return {
		path,
		headers,
		request: { host: 'localhost', protocol: 'http', headers }
	} as Koa.Context;
}

describe('user Context tests', () => {
	it('should get current user', async () => {
		const containerMiddleware = new ContainerContextMiddleware().build();
		const userContextMiddleware = new UserContextMiddleware().build();
		const userMock = new User();
		userMock.id = 30;
		UsersServiceMock.getOrSaveUserFromHeaders.mockImplementation(() => userMock);

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
				return nextMiddleware(context, () => { });
			});
		});

		expect(nextMiddleware).toBeCalled();
	});

	it('should throw error', async () => {
		const userContextMiddleware = new UserContextMiddleware().build();
		const userMock = new User();
		userMock.id = 30;
		UsersServiceMock.getOrSaveUserFromHeaders.mockImplementation(() => userMock);

		const nextMiddleware = jest.fn().mockImplementation(async (ctx: Koa.Context, next: Koa.Next) => {
			return await next();
		});

		const context = buildSampleKoaContext(`${basePath}/somepath`);

		const asyncTest = async () => {
			return await userContextMiddleware(context, () => {
				return nextMiddleware(context, () => { });
			});
		};

		await expect(asyncTest).rejects.toThrowError();
	});
});


class UsersServiceMock extends UsersService {
	public static getOrSaveUserFromHeaders = jest.fn();

	public async getOrSaveUserFromHeaders(...params): Promise<any> {
		return await UsersServiceMock.getOrSaveUserFromHeaders(...params);
	}
}
