import { Inject, InRequestScope } from 'typescript-ioc';
import { basePath } from '../../config/app-config';
import { ContainerContextMiddleware } from '../containerContext.middleware';
import * as Koa from 'koa';
import { ContainerContext } from '../containerContext';

afterEach(() => {
	jest.resetAllMocks();
});

function buildSampleKoaContext(path: string): Koa.Context {
	return {
		path,
		header: {},
		request: { host: 'localhost', protocol: 'http' },
	} as Koa.Context;
}

describe('Container context test', () => {
	it('should preserve container context', async () => {
		const handler = new ContainerContextMiddleware();
		const containerContextMiddleware = handler.build();

		const nextMiddleware = jest.fn().mockImplementation((ctx: Koa.Context, next: Koa.Next) => {
			const container = ContainerContextMiddleware.getContainerContext(ctx);
			const objA = container.resolve(InjectedClassA);
			objA.value = 11;

			return next();
		});

		const finalMiddleware = jest.fn().mockImplementation((ctx: Koa.Context, next: Koa.Next) => {
			const container = ContainerContextMiddleware.getContainerContext(ctx);
			const objB = container.resolve(InjectedClassB);
			const containerResolved = container.resolve(ContainerContext);

			expect(objB.classA.value).toBe(11);
			expect(containerResolved === container).toBe(true);
			return next();
		});

		const context = buildSampleKoaContext(`${basePath}/someapi`);

		await containerContextMiddleware(context, () => {
			return nextMiddleware(context, () => {
				return finalMiddleware(context, () => {});
			});
		});

		expect(nextMiddleware).toBeCalled();
	});
});

@InRequestScope
class InjectedClassA {
	public value: number;
}

@InRequestScope
class InjectedClassB {
	@Inject
	public classA: InjectedClassA;
}
