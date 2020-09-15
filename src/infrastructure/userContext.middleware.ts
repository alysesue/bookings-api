import * as Koa from 'koa';
import { UserContext } from './auth/userContext';
import { ContainerContextMiddleware } from './containerContext.middleware';

export class UserContextMiddleware {
	public build(): Koa.Middleware {
		return async (ctx: Koa.Context, next: Koa.Next): Promise<any> => {
			const containerContext = ContainerContextMiddleware.getContainerContext(ctx);
			const userContext = containerContext.resolve(UserContext);
			userContext.init({ requestHeaders: ctx.request.headers });

			await next();
		};
	}
}
