import { Inject, InjectValue, Singleton } from "typescript-ioc";
import { Service, ServiceProvider } from "../models";
import { logger } from "mol-lib-common/debugging/logging/LoggerV2";

import { ServiceProvidersRepository } from "./serviceProviders.repository";
import { ServiceProviderModel } from "./serviceProviders.apicontract";
import { CalendarsService } from "../calendars/calendars.service";
import { API_TIMEOUT_PERIOD } from "../const";

@Singleton
export class ServiceProvidersService {

	@Inject
	public serviceProvidersRepository: ServiceProvidersRepository;

	@Inject
	public calendarsService: CalendarsService;

	@InjectValue('config.service')
	private service: Service;

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

	public async saveServiceProviders(listRequest: ServiceProviderModel[]) {
		for (let i = 0; i < listRequest.length; i++) {
			await this.saveSp(listRequest[i], this.service);

			if (i > 0) {
				await this.delay(API_TIMEOUT_PERIOD);
			}
		}
	}

	public async saveSp(item: ServiceProviderModel, service: Service) {
		try {
			const cal = await this.calendarsService.createCalendar();
			return await this.serviceProvidersRepository.save(new ServiceProvider(service, item.name, cal));
		} catch (e) {
			logger.error("exception when creating calendar ", e.message);
		}
	}

	private delay(ms) {
		return new Promise((resolve, _reject) => setTimeout(resolve, ms));
	}
}
