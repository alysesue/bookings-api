import { Container, Inject, InjectValue, Singleton } from "typescript-ioc";
import { ServicesService } from "./services.service";

@Singleton
export class ServicesValidation {

	@Inject
	private servicesService: ServicesService;

	@InjectValue('config.serviceName')
	private serviceName: string;

	public async validate() {
		const service = await this.servicesService.getByName(this.serviceName);

		if (!service) {
			throw new Error(`${this.serviceName} is not a valid service`);
		}
		Container.bindName('config').to({service});
	}
}
