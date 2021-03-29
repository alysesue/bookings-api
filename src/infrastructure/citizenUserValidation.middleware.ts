import * as Koa from 'koa';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { MOLAuthType, MOLSecurityHeaderKeys } from 'mol-lib-api-contract/auth';
import { tryParseInt } from '../tools/number';
import { UserContext } from './auth/userContext';
import { ContainerContextMiddleware } from './containerContext.middleware';

const MIN_USER_AUTH_LEVEL = 2;
export class CitizenUserValidationMiddleware {
	public build(): Koa.Middleware {
		return async (ctx: Koa.Context, next: Koa.Next): Promise<any> => {
			const containerContext = ContainerContextMiddleware.getContainerContext(ctx);
			const userContext = containerContext.resolve(UserContext);
			const user = await userContext.getCurrentUser();
			const requestHeaders = ctx.request.headers;

			if (
				user &&
				user.isCitizen() &&
				// tslint:disable-next-line: tsr-detect-possible-timing-attacks
				requestHeaders[MOLSecurityHeaderKeys.AUTH_TYPE] === MOLAuthType.USER &&
				(!requestHeaders[MOLSecurityHeaderKeys.USER_AUTH_LEVEL] ||
					tryParseInt(requestHeaders[MOLSecurityHeaderKeys.USER_AUTH_LEVEL] as string) < MIN_USER_AUTH_LEVEL)
			) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHENTICATION);
			}

			await next();
		};
	}
}
