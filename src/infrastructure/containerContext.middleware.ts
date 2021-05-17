import * as Koa from 'koa';
import { ContainerContext, ContainerContextHolder } from './containerContext';

export class ContainerContextMiddleware {
	public build(): Koa.Middleware {
		ContainerContextHolder.registerInContainer();

		return async (ctx: Koa.Context, next: Koa.Next): Promise<any> => {
			ctx._ContainerContextHolder = ContainerContextHolder.create();
			try {
				await next();
			} finally {
				delete ctx._ContainerContextHolder;
			}
		};
	}

	public static getContainerContext(context: Koa.Context): ContainerContext {
		const holder = context._ContainerContextHolder as ContainerContext;
		if (!holder) {
			throw new Error(
				'ContainerContextHolder not found in koa context. [ContainerContextMiddleware] needs to be registered in Koa pipeline.',
			);
		}
		return holder;
	}
}
