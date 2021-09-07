import * as Koa from 'koa';
import { ServicesValidation } from './components/services/services.validation';
import { ContainerContextMiddleware } from './infrastructure/containerContext.middleware';
import { isNumeric, tryParseInt } from './tools/number';
import { IdHasher } from './infrastructure/idHasher';

export async function koaAuthentication(context: Koa.Context, securityName: string, _scopes?: string[]): Promise<any> {
	const hasService = securityName === 'service';
	const hasOptionalService = securityName === 'optional-service';
	if (hasService || hasOptionalService) {
		const xApiService = context.request.headers['x-api-service'] as string;
		const containerContext = ContainerContextMiddleware.getContainerContext(context);
		const idHasher = containerContext.resolve(IdHasher);
		const serviceId = isNumeric(xApiService) ? tryParseInt(xApiService) : idHasher.decode(xApiService);
		const servicesValidation = containerContext.resolve(ServicesValidation);
		await servicesValidation.validateService(hasOptionalService, serviceId);
	}
}
