import * as Koa from "koa";
import { ServicesValidation } from "./services/services.validation";
import { Container } from "typescript-ioc";

export const koaAuthentication = (
	request: Koa.Request,
	securityName: string,
	scopes?: string[]
): Promise<any> => {
	if (securityName === 'service') {
		const serviceId = request.headers["x-api-service"];
		return new Promise((resolve, reject) => {
			Container
				.get(ServicesValidation)
				.validate(serviceId)
				.then(resolve)
				.catch(reject)
		})
	}
}
