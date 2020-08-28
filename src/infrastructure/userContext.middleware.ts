import * as Koa from "koa";
import { Inject, InRequestScope } from "typescript-ioc";
import { ContainerContext, ContainerContextMiddleware } from "./containerContext.middleware";

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

@InRequestScope
export class UserContext {
	@Inject
	private containerContext: ContainerContext;

	private _requestHeaders: any;

	public init({ requestHeaders }: { requestHeaders: any }) {
		this._requestHeaders = requestHeaders;
	}

	public async getCurrentUser() {
		// TODO: Create or get user based on request headers

		// const service = this.containerContext.resolve(UserService);
	}
}
