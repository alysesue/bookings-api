import { Inject, InRequestScope } from 'typescript-ioc';
import { ServicesService } from './services.service';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';

@InRequestScope
export class ServicesValidation {
	@Inject
	private servicesService: ServicesService;

	public async validate(isOptional: boolean, serviceId?: number): Promise<any> {
		if (serviceId !== undefined) {
			const service = await this.servicesService.getService(serviceId);

			if (!service) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Service not found');
			}
		} else if (!isOptional) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('no service id provided');
		}
	}
}
