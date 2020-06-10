import { Inject, InRequestScope } from "typescript-ioc";
import { Service, ServiceProvider } from "../models";
import { logger } from "mol-lib-common/debugging/logging/LoggerV2";

import { ServiceProvidersRepository } from "./serviceProviders.repository";
import { ServiceProviderModel } from "./serviceProviders.apicontract";
import { CalendarsService } from "../calendars/calendars.service";
import { API_TIMEOUT_PERIOD } from "../const";
import { ServiceConfiguration } from "../common/serviceConfiguration";

@InRequestScope
export class ServiceProvidersService {

	@Inject
	public serviceProvidersRepository: ServiceProvidersRepository;

	@Inject
	public calendarsService: CalendarsService;

	@Inject
	private serviceConfiguration: ServiceConfiguration;

	public async getServiceProviders(): Promise<ServiceProvider[]> {
		return await this.serviceProvidersRepository.getServiceProviders(this.serviceConfiguration.getServiceId());
	}

	public async getServiceProvider(id: number): Promise<ServiceProvider> {
		const sp = await this.serviceProvidersRepository.getServiceProvider(id);
		if (!sp) {
			throw new Error(`Service provider ${sp} is not found`);
		}
		return sp;
	}

	private static validateService(service: Service) {
		if (!service) {
			throw new Error("No service provided");
		}
	}

	public async saveServiceProviders(listRequest: ServiceProviderModel[]) {

		console.log(' **** ServiceProvidersService *** ConfigId: ' + this.serviceConfiguration.configId);

		for (let i = 0; i < listRequest.length; i++) {
			await this.saveSp(listRequest[i], this.serviceConfiguration.service);

			if (i > 0) {
				await this.delay(API_TIMEOUT_PERIOD);
			}
		}
	}

	public async saveSp(item: ServiceProviderModel, service: Service) {
		try {
			ServiceProvidersService.validateService(service);
			const cal = await this.calendarsService.createCalendar();
			return await this.serviceProvidersRepository.save(new ServiceProvider(service, item.name, cal));
		} catch (e) {
			logger.error("exception when creating service provider ", e.message);
			throw e;
		}
	}

	private delay(ms) {
		return new Promise((resolve, _reject) => setTimeout(resolve, ms));
	}
}
