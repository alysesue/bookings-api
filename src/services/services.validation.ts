import { Container, Inject, InjectValue, Singleton } from "typescript-ioc";
import { ServicesService } from "./services.service";

@Singleton
export class ServicesValidation {

	@Inject
	private servicesService: ServicesService;

	@InjectValue('config.serviceName')
	private serviceName: string;

	public validate(serviceId: string): Promise<any> {
		return new Promise(async (resolve, reject) => {
			const service = await this.servicesService.getByName(serviceId);

			if (!service) {
				reject(new Error(`${serviceId} is not a valid service`));
			}
			Container.bindName('config').to({service});
			resolve();
		});

	}
}
