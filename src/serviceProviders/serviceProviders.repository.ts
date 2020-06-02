import { InjectValue, Singleton } from "typescript-ioc";
import { Service, ServiceProvider } from "../models";
import { RepositoryBase } from "../core/repository";

@Singleton
export class ServiceProvidersRepository extends RepositoryBase<ServiceProvider> {

	@InjectValue("config.service")
	private service: Service;

	constructor() {
		super(ServiceProvider);
	}

	public async getServiceProviders(): Promise<ServiceProvider[]> {
		return (await this.getRepository()).find({where: {_serviceId: this.service.id}});
	}

	public async getServiceProvider(id: string): Promise<ServiceProvider> {
		return (await this.getRepository()).findOne(id);
	}

	public async save(serviceProviders: ServiceProvider): Promise<ServiceProvider> {
		return (await this.getRepository()).save(serviceProviders);
	}
}
