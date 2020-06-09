import { Inject, InRequestScope } from "typescript-ioc";
import { ServiceProvider } from "../models";
import { RepositoryBase } from "../core/repository";
import { ServiceConfiguration } from "../common/serviceConfiguration";
import { FindConditions } from "typeorm";

@InRequestScope
export class ServiceProvidersRepository extends RepositoryBase<ServiceProvider> {
	constructor() {
		super(ServiceProvider);
	}

	public async getServiceProviders(serviceId?: number): Promise<ServiceProvider[]> {
		const findConditions: FindConditions<ServiceProvider> = {};
		if (serviceId) {
			findConditions['_serviceId'] = serviceId;
		}
		return (await this.getRepository()).find({ where: [findConditions], relations: ['Calendar'] });
	}

	public async getServiceProvider(id: number): Promise<ServiceProvider> {
		return (await this.getRepository()).findOne({ where: { id }, relations: ['Calendar'] });
	}

	public async save(serviceProviders: ServiceProvider): Promise<ServiceProvider> {
		return (await this.getRepository()).save(serviceProviders);
	}
}
