import { Inject, InRequestScope } from "typescript-ioc";
import { Service, ServiceProvider } from "../models";
import { logger } from "mol-lib-common/debugging/logging/LoggerV2";

import { ServiceProvidersRepository } from "./serviceProviders.repository";
import { ServiceProviderModel } from "./serviceProviders.apicontract";
import { CalendarsService } from "../calendars/calendars.service";
import { API_TIMEOUT_PERIOD } from "../const";

@InRequestScope
export class ServiceProvidersService {

	@Inject
	public serviceProvidersRepository: ServiceProvidersRepository;

	@Inject
	public calendarsService: CalendarsService;

	public async getServiceProviders(serviceId?: number): Promise<ServiceProvider[]> {
		return await this.serviceProvidersRepository.getServiceProviders(serviceId);
	}

	public async getServiceProvider(id: number): Promise<ServiceProvider> {
		const sp = await this.serviceProvidersRepository.getServiceProvider(id);
		if (!sp) {
			throw new Error(`Service provider ${sp} is not found`);
		}
		return sp;
	}

	private static validateService(serviceId: number) {
		if (!serviceId) {
			throw new Error("No service provided");
		}
	}

	public async saveServiceProviders(listRequest: ServiceProviderModel[], serviceId: number) {
		for (let i = 0; i < listRequest.length; i++) {
			await this.saveSp(listRequest[i], serviceId);

			if (i > 0) {
				await this.delay(API_TIMEOUT_PERIOD);
			}
		}
	}

	public async saveSp(item: ServiceProviderModel, serviceId: number) {
		try {
			ServiceProvidersService.validateService(serviceId);
			const cal = await this.calendarsService.createCalendar();
			return await this.serviceProvidersRepository.save(new ServiceProvider(item.name, cal, serviceId));
		} catch (e) {
			logger.error("exception when creating service provider ", e.message);
			throw e;
		}
	}

	private delay(ms) {
		return new Promise((resolve, _reject) => setTimeout(resolve, ms));
	}
}
