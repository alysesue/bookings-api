import { Inject, Singleton } from "typescript-ioc";
import { ServiceProvider } from "../models";

import { ServiceProvidersRepository } from "./serviceProviders.repository";
import { ServiceProviderModel } from "./serviceProviders.apicontract";
import { CalendarsService } from "../calendars/calendars.service";

@Singleton
export class ServiceProvidersService {
	@Inject
	private serviceProvidersRepository: ServiceProvidersRepository;

	@Inject
	private calendarsService: CalendarsService;

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
		const spList = this.mapBulkRequest(listRequest)
		spList.map(async (i) => {
			const calendar = await this.calendarsService.createCalendar();
			i.calendar = calendar;
		}) as unknown as ServiceProvider[];
		return await this.serviceProvidersRepository.saveBulk(spList);
	}

	public mapBulkRequest(req: ServiceProviderModel[]): ServiceProvider[] {
		const res: ServiceProvider[] = [];
		req.forEach(item => {
			res.push(new ServiceProvider(item.name));
		});
		return res;
	}

}
