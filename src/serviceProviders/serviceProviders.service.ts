import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";
import { Inject, InRequestScope } from "typescript-ioc";
import { Schedule, ServiceProvider } from "../models";
import { logger } from "mol-lib-common/debugging/logging/LoggerV2";
import { ServiceProvidersRepository } from "./serviceProviders.repository";
import { ServiceProviderModel, SetProviderScheduleRequest } from "./serviceProviders.apicontract";
import { CalendarsService } from "../calendars/calendars.service";
import { API_TIMEOUT_PERIOD } from "../const";
import { SchedulesService } from '../schedules/schedules.service';
import { TimeslotsScheduleResponse } from "../timeslotItems/timeslotItems.apicontract";
import { mapToTimeslotsScheduleResponse } from "../timeslotItems/timeslotItems.mapper";
import { TimeslotsScheduleRepository } from "../timeslotItems/timeslotsSchedule.repository";
import { ServicesRepository } from "../services/services.repository";

@InRequestScope
export class ServiceProvidersService {

	@Inject
	public serviceProvidersRepository: ServiceProvidersRepository;

	@Inject
	public calendarsService: CalendarsService;

	@Inject
	private schedulesService: SchedulesService;

	@Inject
	private timeslotsScheduleRepository: TimeslotsScheduleRepository;

	@Inject
	private servicesRepository: ServicesRepository;

	public async getServiceProviders(serviceId?: number): Promise<ServiceProvider[]> {
		return await this.serviceProvidersRepository.getServiceProviders({ serviceId });
	}

	public async getServiceProvider(id: number): Promise<ServiceProvider> {
		const sp = await this.serviceProvidersRepository.getServiceProvider({ id });
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
			return await this.serviceProvidersRepository.save(ServiceProvider.create(item.name, cal, serviceId));
		} catch (e) {
			logger.error("exception when creating service provider ", e.message);
			throw e;
		}
	}

	private delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	public async setProviderSchedule(id: number, model: SetProviderScheduleRequest): Promise<Schedule> {
		const serviceProvider = await this.serviceProvidersRepository.getServiceProvider({ id });
		if (!serviceProvider) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service Provider not found');
		}

		let schedule: Schedule = null;
		if (model.scheduleId) {
			schedule = await this.schedulesService.getSchedule(model.scheduleId);
			if (!schedule) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Schedule not found');
			}
		}

		serviceProvider.schedule = schedule;
		await this.serviceProvidersRepository.save(serviceProvider);
		return schedule;
	}

	public async getProviderSchedule(id: number): Promise<Schedule> {
		const serviceProvider = await this.serviceProvidersRepository.getServiceProvider({ id, includeSchedule: true });
		if (!serviceProvider) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service Provider not found');
		}

		if (!serviceProvider.schedule) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service schedule not found');
		}

		return serviceProvider.schedule;
	}

	public async getTimeslotItemsByServiceProviderId(id: number): Promise<TimeslotsScheduleResponse> {
		const serviceProvider = await this.serviceProvidersRepository.getServiceProvider({id, includeSchedule: false, includeTimeslotsSchedule: true});
		if (!serviceProvider) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service provider not found');
		}
		if(!serviceProvider.timeslotsScheduleId) {
			const serviceId = serviceProvider.serviceId;
			const service = await this.servicesRepository.getService(serviceId);
			return mapToTimeslotsScheduleResponse(await this.timeslotsScheduleRepository.getTimeslotsScheduleById(service.timeslotsScheduleId));
		}
		return mapToTimeslotsScheduleResponse(serviceProvider.timeslotsSchedule);
	}
}
