import * as Koa from 'koa';
import { ServicesValidation } from './components/services/services.validation';
import { ContainerContextMiddleware } from './infrastructure/containerContext.middleware';

export async function koaAuthentication(context: Koa.Context, securityName: string, scopes?: string[]): Promise<any> {
	const hasService = securityName === 'service';
	const hasOptionalService = securityName === 'optional-service';
	if (hasService || hasOptionalService) {
		const serviceId: number = context.request.headers['x-api-service'];
		const containerContext = ContainerContextMiddleware.getContainerContext(context);
		const servicesValidation = containerContext.resolve(ServicesValidation);
		await servicesValidation.validate(hasOptionalService, serviceId);
	}
}
