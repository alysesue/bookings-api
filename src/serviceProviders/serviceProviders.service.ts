import { Inject, Singleton } from "typescript-ioc";
import { ServiceProvider } from "../models";

import { ServiceProvidersRepository } from "./serviceProviders.repository";
import { ServiceProviderModel } from "./serviceProviders.apicontract";

@Singleton
export class ServiceProvidersService {
	@Inject
	private serviceProvidersRepository: ServiceProvidersRepository;


	public async getServiceProviders(): Promise<ServiceProvider[]> {
		return await this.serviceProvidersRepository.getServiceProviders();
	}

	public async getServiceProvider(id: string): Promise<ServiceProvider> {
		const sp = await this.serviceProvidersRepository.getServiceProvider(id);
		if (!sp) {
			throw new Error(`Service provider ${sp} is not found`);
		}
		return sp;
	}

	public async save(listRequest: ServiceProviderModel[]): Promise<ServiceProvider[]> {
		return await this.serviceProvidersRepository.saveBulk(this.mapBulkRequest(listRequest));
	}

	public mapBulkRequest(req: ServiceProviderModel[]): ServiceProvider[] {
		const res: ServiceProvider[] = [];
		req.forEach(item => {
			res.push(new ServiceProvider(item.name));
		});
		return res;
	}

}
