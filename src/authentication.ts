import * as Koa from "koa";
import { ServicesValidation } from "./services/services.validation";
import { Container } from "typescript-ioc";

export async function koaAuthentication(
	request: Koa.Request,
	securityName: string,
	scopes?: string[]
): Promise<any> {
	if (securityName === 'service') {
		const serviceId: number = request.headers["x-api-service"];
		await Container.get(ServicesValidation).validate(serviceId);
	}
}
