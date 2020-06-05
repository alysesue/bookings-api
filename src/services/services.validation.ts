import { Container, Inject, InjectValue, Singleton } from "typescript-ioc";
import { ServicesService } from "./services.service";

@Singleton
export class ServicesValidation {

	@Inject
	private servicesService: ServicesService;

	@InjectValue('config.serviceName')
	private serviceName: string;

	public validate(serviceId: number): Promise<any> {
		return new Promise(async (resolve, reject) => {
			try {
				const service = await this.servicesService.getService(serviceId);

				if (!service) {
					reject(new Error(`${serviceId} is not a valid service`));
				}
				Container.bindName('config').to({service});
				resolve();
			} catch (error) {
				reject(error);
			}
		});

	}
}
