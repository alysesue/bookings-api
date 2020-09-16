import * as Koa from 'koa';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { UserContext } from './auth/userContext';
import { ContainerContextMiddleware } from './containerContext.middleware';

export class UserContextMiddleware {
	public build(): Koa.Middleware {
		return async (ctx: Koa.Context, next: Koa.Next): Promise<any> => {
			const containerContext = ContainerContextMiddleware.getContainerContext(ctx);
			const userContext = containerContext.resolve(UserContext);
			userContext.init({ requestHeaders: ctx.request.headers });

			const userGroups = await userContext.getAuthGroups();
			if (userGroups.length === 0) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
					'There are no user groups associated with the current user.',
				);
			}

			await next();
		};
	}
}
