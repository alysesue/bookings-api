import * as Koa from 'koa';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { UserContext } from './auth/userContext';
import { BookingSGCookieHelper, MobileOtpCookieHelper } from './bookingSGCookieHelper';
import { ContainerContextMiddleware } from './containerContext.middleware';

export class UserContextMiddleware {
	public build(): Koa.Middleware {
		return async (ctx: Koa.Context, next: Koa.Next): Promise<any> => {
			const containerContext = ContainerContextMiddleware.getContainerContext(ctx);
			const userContext = containerContext.resolve(UserContext);
			const requestHeaders = ctx.request.headers;
			userContext.init({ requestHeaders });

			const user = await userContext.getCurrentUser();
			if (!user) {
				const anonymousCookieHelper = containerContext.resolve(BookingSGCookieHelper);
				const anonymousData = anonymousCookieHelper.getCookieValue();
				if (anonymousData) {
					userContext.setAnonymousUser(anonymousData);
					const mobileOtpCookieHelper = containerContext.resolve(MobileOtpCookieHelper);
					const mobileOtpCookie = mobileOtpCookieHelper.getCookieValue();
					await userContext.otpAddOn(mobileOtpCookie);

					const otpAddOnMobileNo = userContext.getOtpAddOnMobileNo();
					if (!otpAddOnMobileNo) {
						throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHENTICATION).setMessage(
							'User is not authenticated with mobile otp',
						);
					}
				}
			}

			const userGroups = await userContext.getAuthGroups();
			if (userGroups.length === 0) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHENTICATION).setMessage(
					'There are no user groups associated with the current user.',
				);
			}

			await next();
		};
	}
}
