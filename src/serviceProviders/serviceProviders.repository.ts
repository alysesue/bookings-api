import { Inject, InRequestScope } from "typescript-ioc";
import { ServiceProvider } from "../models";
import { RepositoryBase } from "../core/repository";
import { ServiceConfiguration } from "../common/serviceConfiguration";

@InRequestScope
export class ServiceProvidersRepository extends RepositoryBase<ServiceProvider> {

	@Inject
	private serviceConfiguration: ServiceConfiguration;

	constructor() {
		super(ServiceProvider);
	}

	public async getServiceProviders(): Promise<ServiceProvider[]> {
		return (await this.getRepository()).find({where: {_serviceId: this.serviceConfiguration.getServiceId()}});
	}

	public async getServiceProvider(id: string): Promise<ServiceProvider> {
		return (await this.getRepository()).findOne(id);
	}

	public async save(serviceProviders: ServiceProvider): Promise<ServiceProvider> {
		return (await this.getRepository()).save(serviceProviders);
	}
}
