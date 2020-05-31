import { Singleton } from "typescript-ioc";
import { ServiceProvider } from "../models";
import { RepositoryBase } from "../core/repository";

@Singleton
export class ServiceProvidersRepository extends RepositoryBase<ServiceProvider> {

	constructor() {
		super(ServiceProvider);
	}

	public async getServiceProviders(): Promise<ServiceProvider[]> {
		return (await this.getRepository()).find();
	}

	public async getServiceProvider(id: string): Promise<ServiceProvider> {
		return (await this.getRepository()).findOne(id);
	}

	public async saveBulk(serviceProviders: ServiceProvider[]): Promise<ServiceProvider[]> {
		return (await this.getRepository()).save(serviceProviders);
	}
}
