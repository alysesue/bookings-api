import { MOLAuth } from 'mol-lib-common';
import * as Koa from 'koa';
import { ContainerContextMiddleware } from '../containerContext.middleware';
import { UserContext } from '../auth/userContext';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';

const emptyFunction = async (): Promise<void> => {};

export type AuthConfig = MOLAuth.Config & {
	bypassAuth?: boolean;
	anonymous?: boolean;
	otp?: boolean;
};

export function BookingSGAuth(
	config: AuthConfig,
): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor {
	const decorator = (target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
		const originalMethod = descriptor.value;

		if (!config.bypassAuth) {
			const molDecoratorFunction = getMolDecoratorFunction(target, propertyKey, descriptor);

			// function keyword preserves 'this' (the controller instance)
			descriptor.value = async function decoratedMethod(...params) {
				const context = (this as any).context as Koa.Context;
				if ((await isOtpAuth(context)) && !config.otp) {
					throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHENTICATION).setMessage(
						'Endpoint does not support otp user',
					);
				} else if ((await isAnonymousAuth(context)) && !config.anonymous) {
					throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHENTICATION).setMessage(
						'Endpoint does not support anonymous user',
					);
				} else {
					await molDecoratorFunction.apply(this, params);
				}

				return await originalMethod.apply(this, params);
			};
		}

		// NOTE: Used in tsoa-koa.hbs to ensure that the route is secured by this decorator
		descriptor.value._bookingSGAuthSet = true;

		return descriptor;
	};

	const getMolDecoratorFunction = (target: any, propertyKey: string, descriptor: PropertyDescriptor): Function => {
		const molDescriptor = { ...descriptor, value: emptyFunction as Function };
		const molAuthDecorator = MOLAuth({ ...config });
		molAuthDecorator(target, propertyKey, molDescriptor);

		return molDescriptor.value;
	};

	const resolveUserContext = (ctx: Koa.Context): UserContext => {
		const containerContext = ContainerContextMiddleware.getContainerContext(ctx);
		return containerContext.resolve(UserContext);
	};

	const isAnonymousAuth = async (ctx: Koa.Context): Promise<boolean> => {
		const userContext = resolveUserContext(ctx);
		const user = await userContext.getCurrentUser();
		return user && user.isAnonymous();
	};

	const isOtpAuth = async (ctx: Koa.Context): Promise<boolean> => {
		const userContext = resolveUserContext(ctx);
		const user = await userContext.getCurrentUser();
		return user && user.isOtp();
	};

	return decorator;
}
