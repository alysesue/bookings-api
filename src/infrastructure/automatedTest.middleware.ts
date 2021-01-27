import * as Koa from 'koa';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { logger } from 'mol-lib-common';

const AUTOMATED_TEST_HEADER = 'x-bookingsg-automated';

export class AutomatedTestMiddleware {
	private static parseHeader(value: string): { [k: string]: string } {
		if (!value) {
			return undefined;
		}

		try {
			return JSON.parse(value);
		} catch {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`${AUTOMATED_TEST_HEADER} header is invalid`,
			);
		}
	}

	public build(): Koa.Middleware {
		logger.info('Using Automated Test Middleware');
		return async (ctx: Koa.Context, next: Koa.Next): Promise<any> => {
			const value = ctx.request.headers[AUTOMATED_TEST_HEADER];
			const automatedHeaders = AutomatedTestMiddleware.parseHeader(value);
			if (automatedHeaders) {
				for (const headerKey of Object.keys(automatedHeaders)) {
					ctx.request.headers[headerKey] = automatedHeaders[headerKey];
				}
			}

			await next();
		};
	}
}
