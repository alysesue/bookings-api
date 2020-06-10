import * as Koa from "koa";
import * as KoaRouter from 'koa-router';
import { BuildContext } from "typescript-ioc";
import { IoCContainer } from "typescript-ioc/dist/container/container";
import { ObjectFactory } from "typescript-ioc/dist/model";

const KoaBuildContext = '__KoaIocBuildContext';

export function koaScopeBoundMiddleware(): KoaRouter.IMiddleware {
	return async (ctx: Koa.Context, next: Koa.Next): Promise<any> => {
		// Attaches a ContainerBuildContext to the request
		ctx.request[KoaBuildContext] = new ContainerBuildContext();
		await next();
	};
}

export function getKoaScopedInstance<T>(source: Function & { prototype: T }, request: Koa.Request): T {
	const buildContext = request[KoaBuildContext];
	if (!buildContext){
		throw new Error('KoaBuildContext not initialized via middleware.');
	}

	console.log(' **** getKoaScopedInstance called **** ');

	return IoCContainer.get(source, buildContext);
}

class ContainerBuildContext extends BuildContext {
	private context = new Map<Function, any>();

	public build<T>(source: Function & { prototype: T; }, factory: ObjectFactory): T {
		let instance = this.context.get(source);
		if (!instance) {
			instance = factory(this);
			this.context.set(source, instance);
		}
		return instance;
	}

	public resolve<T>(source: Function & { prototype: T }): T {
		return IoCContainer.get(source, this);
	}
}
