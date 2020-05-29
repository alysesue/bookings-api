import { Singleton } from "typescript-ioc";
import { ServiceProvider } from "../models";
import { RepositoryBase } from "../core/repository";

@Singleton
export class ServiceProvidersRepository extends RepositoryBase {

	constructor() {
		super(ServiceProvider);
	}

	public async getServiceProviders(): Promise<ServiceProvider[]> {
		return (await this.getRepository<ServiceProvider>()).find();
	}

	public async getServiceProvider(id: string): Promise<ServiceProvider> {
		return (await this.getRepository<ServiceProvider>()).findOne(id);
	}

	public async save(serviceProvider: ServiceProvider): Promise<ServiceProvider> {
		return (await this.getRepository<ServiceProvider>()).save(serviceProvider);
	}
}
