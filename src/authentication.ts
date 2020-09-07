import * as Koa from 'koa';
import { ServicesValidation } from './components/services/services.validation';
import { Container } from 'typescript-ioc';

export async function koaAuthentication(request: Koa.Request, securityName: string, scopes?: string[]): Promise<any> {
	const hasService = securityName === 'service';
	const hasOptionalService = securityName === 'optional-service';
	if (hasService || hasOptionalService) {
		const serviceId: number = request.headers['x-api-service'];
		await Container.get(ServicesValidation).validate(hasOptionalService, serviceId);
	}
}
