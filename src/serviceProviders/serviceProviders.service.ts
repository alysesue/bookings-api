import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";
import { Inject, InRequestScope } from "typescript-ioc";
import { Schedule, ServiceProvider, TimeslotItem, TimeslotsSchedule } from "../models";
import { logger } from "mol-lib-common/debugging/logging/LoggerV2";
import { ServiceProvidersRepository } from "./serviceProviders.repository";
import { ServiceProviderModel, SetProviderScheduleRequest } from "./serviceProviders.apicontract";
import { CalendarsService } from "../calendars/calendars.service";
import { API_TIMEOUT_PERIOD } from "../const";
import { SchedulesService } from '../schedules/schedules.service';
import {
	TimeslotItemRequest, TimeslotItemResponse,
	TimeslotsScheduleResponse
} from "../timeslotItems/timeslotItems.apicontract";
import { mapToTimeslotsScheduleResponse } from "../timeslotItems/timeslotItems.mapper";
import { TimeslotsScheduleRepository } from "../timeslotsSchedules/timeslotsSchedule.repository";
import { ServicesRepository } from "../services/services.repository";
import { ServicesService } from "../services/services.service";
import { TimeslotItemsService } from "../timeslotItems/timeslotItems.service";

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
	private timeslotItemsService: TimeslotItemsService;

	@Inject
	private servicesRepository: ServicesRepository;

	@Inject
	private servicesService: ServicesService;

	public async getServiceProviders(serviceId?: number, includeSchedule= false, includeTimeslotsSchedule = false): Promise<ServiceProvider[]> {
		return await this.serviceProvidersRepository.getServiceProviders({ serviceId, includeSchedule, includeTimeslotsSchedule });
	}

	public async getServiceProvider(id: number, includeSchedule: boolean, includeTimeslotsSchedule: boolean): Promise<ServiceProvider> {
		const sp = await this.serviceProvidersRepository.getServiceProvider({id, includeSchedule, includeTimeslotsSchedule});
		if (!sp) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service provider not found');
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
		const serviceProvider = await this.getServiceProvider(id, true, false);

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
		const serviceProvider = await this.getServiceProvider(id, true, false);
		if (!serviceProvider) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service Provider not found');
		}

		if (!serviceProvider.schedule) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service schedule not found');
		}

		return serviceProvider.schedule;
	}

	public async getTimeslotItems(id: number): Promise<TimeslotsSchedule> {
		const serviceProvider = await this.getServiceProvider(id, false, true);
		if (!serviceProvider.timeslotsSchedule) {
			const service = await this.servicesRepository.getServiceWithTimeslotsSchedule(serviceProvider.serviceId);
			serviceProvider.timeslotsSchedule = service.timeslotsSchedule;
		}
		return serviceProvider.timeslotsSchedule;
	}

	public async addTimeslotItem(serviceProviderId: number, request: TimeslotItemRequest)
		: Promise<TimeslotItem> {
		const serviceProvider = await this.getServiceProvider(serviceProviderId, false, true);
		if (!serviceProvider.timeslotsSchedule) {
			serviceProvider.timeslotsSchedule = await this.createTimeslotsScheduleForServiceProvider(serviceProvider);
			const service = await this.servicesRepository.getServiceWithTimeslotsSchedule(serviceProvider.serviceId);
			serviceProvider.timeslotsSchedule.timeslotItems =
				await this.timeslotItemsService.mapAndSaveTimeslotItemsToTimeslotsSchedule(service.timeslotsSchedule.timeslotItems, serviceProvider.timeslotsSchedule);
		}
		return this.timeslotItemsService.createTimeslotItem(serviceProvider.timeslotsSchedule, request);
	}

	public async updateTimeslotItem(serviceProviderId: number, timeslotId: number, request: TimeslotItemRequest)
		: Promise<TimeslotItem> {
		const serviceProvider = await this.getServiceProvider(serviceProviderId, false, true);
		if (!serviceProvider.timeslotsSchedule) {
			const service = await this.servicesRepository.getServiceWithTimeslotsSchedule(serviceProvider.serviceId);
			const timeslotItemTargetInService = service.timeslotsSchedule.timeslotItems.find(t => t._id === timeslotId);
			if (timeslotItemTargetInService) {
				const timeslotItemServiceWithoutTargetItem = service.timeslotsSchedule.timeslotItems.filter(t => t._id !== timeslotId);
				serviceProvider.timeslotsSchedule = await this.createTimeslotsScheduleForServiceProvider(serviceProvider);
				serviceProvider.timeslotsSchedule.timeslotItems =
					await this.timeslotItemsService.mapAndSaveTimeslotItemsToTimeslotsSchedule(timeslotItemServiceWithoutTargetItem, serviceProvider.timeslotsSchedule);
				delete timeslotItemTargetInService._id;
				return this.timeslotItemsService.mapAndSaveTimeslotItem(serviceProvider.timeslotsSchedule, request, timeslotItemTargetInService);
			}
		}
		const timeslotItem = serviceProvider.timeslotsSchedule.timeslotItems.find(t => t._id === timeslotId);
		if (!timeslotItem) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Timeslot item not found');
		}
		return this.timeslotItemsService.mapAndSaveTimeslotItem(serviceProvider.timeslotsSchedule, request, timeslotItem);
	}

	public async deleteTimeslotItem(serviceProviderId: number, timeslotId: number) {
		const serviceProvider = await this.getServiceProvider(serviceProviderId, false, true);
		if (!serviceProvider.timeslotsSchedule) {
			const service = await this.servicesRepository.getServiceWithTimeslotsSchedule(serviceProvider.serviceId);
			const timeslotItemTargetInService = service.timeslotsSchedule.timeslotItems.find(t => t._id === timeslotId);
			if (timeslotItemTargetInService) {
				const timeslotItemServiceWithoutTargetItem = service.timeslotsSchedule.timeslotItems.filter(t => t._id !== timeslotId);
				serviceProvider.timeslotsSchedule = await this.createTimeslotsScheduleForServiceProvider(serviceProvider);
				serviceProvider.timeslotsSchedule.timeslotItems =
					await this.timeslotItemsService.mapAndSaveTimeslotItemsToTimeslotsSchedule(timeslotItemServiceWithoutTargetItem, serviceProvider.timeslotsSchedule);
				return;
			}
		}
		await this.timeslotItemsService.deleteTimeslot(timeslotId);
	}

	private async createTimeslotsScheduleForServiceProvider(serviceProvider: ServiceProvider): Promise<TimeslotsSchedule> {
		const timeslotsScheduleData = new TimeslotsSchedule();
		timeslotsScheduleData._serviceProvider = ServiceProvider;
		const timeslotsSchedule = await this.timeslotsScheduleRepository.createTimeslotsSchedule(timeslotsScheduleData);
		if (timeslotsSchedule._id) {
			serviceProvider.timeslotsSchedule = timeslotsSchedule;
			await this.serviceProvidersRepository.save(serviceProvider);
		}
		return timeslotsSchedule;
	}

}
