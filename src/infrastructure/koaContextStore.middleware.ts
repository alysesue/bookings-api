import * as Koa from 'koa';
import { Container, InRequestScope, Scope } from 'typescript-ioc';
import { ContainerContextMiddleware } from './containerContext.middleware';

export abstract class KoaContextStore {
	public koaContext: Koa.Context;
	public manualContext: boolean;
}

export const MANUAL_CONTEXT_RESPONSE = '_manualContextResponse';

@InRequestScope
export class KoaContextStoreImplementation implements KoaContextStore {
	private _koaContext: Koa.Context;
	private constructor() {}

	public get manualContext(): boolean {
		return Boolean(this._koaContext[MANUAL_CONTEXT_RESPONSE]);
	}

	public set manualContext(value: boolean) {
		this._koaContext[MANUAL_CONTEXT_RESPONSE] = value;
	}

	private static _registered = false;
	public static registerInContainer() {
		if (!KoaContextStoreImplementation._registered) {
			Container.bind(KoaContextStore)
				.factory((buildContext) => buildContext.resolve(KoaContextStoreImplementation))
				.scope(Scope.Request);
			KoaContextStoreImplementation._registered = true;
		}
	}

	public get koaContext(): Koa.Context {
		if (!this._koaContext) {
			throw new Error('Not in a Koa Context request or context not registered.');
		}

		return this._koaContext;
	}

	public set koaContext(value: Koa.Context) {
		this._koaContext = value;
	}
}

export class KoaContextStoreMiddleware {
	public build(): Koa.Middleware {
		KoaContextStoreImplementation.registerInContainer();

		return async (ctx: Koa.Context, next: Koa.Next): Promise<any> => {
			const containerContext = ContainerContextMiddleware.getContainerContext(ctx);
			const koaContextStore = containerContext.resolve(KoaContextStore);
			try {
				koaContextStore.koaContext = ctx;
				await next();
			} finally {
				koaContextStore.koaContext = undefined;
			}
		};
	}
}
