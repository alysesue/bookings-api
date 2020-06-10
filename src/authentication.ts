import * as Koa from "koa";
import { ServicesValidation } from "./services/services.validation";
import { Container } from "typescript-ioc";
import { getKoaScopedInstance, koaScopeBoundMiddleware } from './infrastructure/koaScopeBound.middleware';

export async function koaAuthentication(
	request: Koa.Request,
	securityName: string,
	scopes?: string[]
): Promise<any> {
	if (securityName === 'service') {
		const serviceId: number = request.headers["x-api-service"];
		const servicesValidation = getKoaScopedInstance(ServicesValidation, request);
		await servicesValidation.validate(serviceId);
	}
}
