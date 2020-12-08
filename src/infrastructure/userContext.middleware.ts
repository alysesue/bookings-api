import * as Koa from 'koa';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { MOLAuthType, MOLSecurityHeaderKeys } from 'mol-lib-api-contract/auth';
import { User } from '../models';
import { UserContext } from './auth/userContext';
import { BookingSGCookieHelper } from './bookingSGCookieHelper';
import { ContainerContextMiddleware } from './containerContext.middleware';

const MIN_USER_AUTH_LEVEL = 2;
export class UserContextMiddleware {
	public build(): Koa.Middleware {
		return async (ctx: Koa.Context, next: Koa.Next): Promise<any> => {
			const containerContext = ContainerContextMiddleware.getContainerContext(ctx);
			const userContext = containerContext.resolve(UserContext);
			const requestHeaders = ctx.request.headers;
			userContext.init({ requestHeaders });

			const user = await userContext.getCurrentUser();
			if (!user) {
				const cookieHelper = containerContext.resolve(BookingSGCookieHelper);
				const anonymousData = cookieHelper.getCookieValue<{ trackingId: string }>();
				if (anonymousData) {
					const anonymousUser = User.createAnonymousUser(anonymousData);
					userContext.setAnonymousUser(anonymousUser);
				}
			}

			const userGroups = await userContext.getAuthGroups();
			if (userGroups.length === 0) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHENTICATION).setMessage(
					'There are no user groups associated with the current user.',
				);
			}

			if (
				user &&
				user.isCitizen() &&
				// tslint:disable-next-line: tsr-detect-possible-timing-attacks
				requestHeaders[MOLSecurityHeaderKeys.AUTH_TYPE] === MOLAuthType.USER &&
				(!requestHeaders[MOLSecurityHeaderKeys.USER_AUTH_LEVEL] ||
					requestHeaders[MOLSecurityHeaderKeys.USER_AUTH_LEVEL] < MIN_USER_AUTH_LEVEL)
			) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHENTICATION);
			}

			await next();
		};
	}
}
