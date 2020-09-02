import * as Koa from "koa";
import { Inject, InRequestScope } from "typescript-ioc";
import { ContainerContext, ContainerContextMiddleware } from "./containerContext.middleware";
import { User } from "../models";
import { UsersService } from "../components/users/users.service";

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
	private _currentUser?: User;
	private _loaded: boolean;

	public init({ requestHeaders }: { requestHeaders: any }) {
		this._requestHeaders = requestHeaders || {};
		this._loaded = false;
	}

	public async getCurrentUser(): Promise<User> {
		if (this._loaded) {
			return this._currentUser;
		}

		const usersService = this.containerContext.resolve(UsersService);
		this._currentUser = await usersService.getOrSaveUserFromHeaders(this._requestHeaders);
		this._loaded = true;
		return this._currentUser;
	}
}
