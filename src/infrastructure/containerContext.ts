import { BuildContext, Container, Inject, InRequestScope, Scope } from 'typescript-ioc';

export abstract class ContainerContext {
	public abstract resolve<T>(source: Function & { prototype: T }): T;
}

@InRequestScope
export class ContainerContextHolder implements ContainerContext {
	@Inject
	private _containerBuildContext: BuildContext;
	private constructor() {}

	public resolve<T>(source: Function & { prototype: T }): T {
		return this._containerBuildContext.resolve<T>(source);
	}

	private static _registered = false;
	public static registerInContainer() {
		if (!ContainerContextHolder._registered) {
			Container.bind(BuildContext)
				.factory((buildContext) => buildContext)
				.scope(Scope.Request);
			Container.bind(ContainerContext)
				.factory((buildContext) => buildContext.resolve(ContainerContextHolder))
				.scope(Scope.Request);
			ContainerContextHolder._registered = true;
		}
	}

	public static create(): ContainerContext {
		const holder = Container.get(ContainerContextHolder);
		const buildContext = holder._containerBuildContext;
		if (!buildContext) {
			throw new Error('IOC BuildContext not registered in Container. Consider calling [registerInContainer()].');
		}
		return holder;
	}
}
