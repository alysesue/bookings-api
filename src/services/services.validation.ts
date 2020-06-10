import { Container, Inject, InRequestScope } from "typescript-ioc";
import { ServicesService } from "./services.service";
import { ServiceConfiguration } from "../common/serviceConfiguration";
import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";
import { AdvancedConsoleLogger } from "typeorm";

@InRequestScope
export class ServicesValidation {

	@Inject
	private servicesService: ServicesService;

	public async validate(serviceId: number): Promise<any> {
		if (!serviceId) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_GENERIC).setMessage('no service id provided');
		}
		const service = await this.servicesService.getService(serviceId);

		if (!service) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_GENERIC).setMessage('Service not found');
		}

		const serviceConfiguation = Container.get(ServiceConfiguration);
		serviceConfiguation.service = service;

		console.log(' **** ServicesValidation *** ConfigId: ' + serviceConfiguation.configId);
	}
}
