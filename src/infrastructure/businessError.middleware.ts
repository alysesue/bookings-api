import * as Koa from 'koa';
import { logger } from 'mol-lib-common';
import { BusinessError } from '../errors/businessError';
import { ErrorCodeV2 } from 'mol-lib-api-contract';
import * as HttpStatus from 'http-status-codes';

export class BusinessErrorItemContract {
	public code?: string;
	public message: string;
}

export class BusinessErrorContract {
	public data: BusinessErrorItemContract[];
	public errorCode: string;
	public errorName: string;
	public errorMessage: string;
}

export class BusinessErrorMiddleware {
	private static mapToApiContract(err: BusinessError): BusinessErrorContract {
		const items = err.validations.map((v) => {
			const item = new BusinessErrorItemContract();
			item.code = v.code;
			item.message = v.message;
			return item;
		});

		const response = new BusinessErrorContract();
		response.data = items;
		response.errorCode = ErrorCodeV2.SYS_INVALID_PARAM.code;
		response.errorName = err.name;
		response.errorMessage = 'One or more business validations failed';

		return response;
	}

	public build(): Koa.Middleware {
		return async (ctx: Koa.Context, next: Koa.Next): Promise<any> => {
			try {
				await next();
			} catch (err) {
				if (err instanceof BusinessError) {
					logger.debug(`BusinessError is being handled`, err);

					ctx.response.status = HttpStatus.BAD_REQUEST;
					ctx.response.body = BusinessErrorMiddleware.mapToApiContract(err);
				} else {
					throw err;
				}
			}
		};
	}
}
