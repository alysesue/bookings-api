import { Inject, Singleton } from "typescript-ioc";
import { ServiceProvider } from "../models";
import { logger } from "mol-lib-common/debugging/logging/LoggerV2";

import { ServiceProvidersRepository } from "./serviceProviders.repository";
import { ServiceProviderModel } from "./serviceProviders.apicontract";
import { CalendarsService } from "../calendars/calendars.service";
import { Calendar } from "../models/calendar";
import { ServiceProviderStatus } from "../models/serviceProviderStatus";
import { API_TIMEOUT_PERIOD } from "../const/index"
@Singleton
export class ServiceProvidersService {
	@Inject
	public serviceProvidersRepository: ServiceProvidersRepository;

	@Inject
	public calendarsService: CalendarsService;

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
		for (const item of listRequest) {
			await this.saveSp(item);
			await this.delay(API_TIMEOUT_PERIOD);
		}
	}

	public async saveSp(item: ServiceProviderModel) {
		try {
			const cal = await this.calendarsService.createCalendar();
			return await this.serviceProvidersRepository.save(new ServiceProvider(item.name, cal));
		}
		catch (e) {
			logger.error("exception when creating calendar ", e.message);
		}
	}

	private delay(ms) {
		return new Promise((resolve, _reject) => setTimeout(resolve, ms));
	}
}
