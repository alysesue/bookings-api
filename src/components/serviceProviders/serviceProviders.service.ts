import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";
import { Inject, InRequestScope } from "typescript-ioc";
import { cloneDeep } from 'lodash';
import { Schedule, ServiceProvider, TimeOfDay, TimeslotItem, TimeslotsSchedule } from "../../models";
import { ServiceProvidersRepository } from "./serviceProviders.repository";
import { ServiceProviderModel, SetProviderScheduleRequest } from "./serviceProviders.apicontract";
import { CalendarsService } from "../calendars/calendars.service";
import { API_TIMEOUT_PERIOD } from "../../const";
import { SchedulesService } from '../schedules/schedules.service';
import { TimeslotItemRequest } from "../timeslotItems/timeslotItems.apicontract";
import { ServicesService } from "../services/services.service";
import { TimeslotItemsService } from "../timeslotItems/timeslotItems.service";
import { validatePhoneNumber } from "../../tools/phone";
import { validateEmail } from "../../tools/email";
import { TimeslotsService } from "../timeslots/timeslots.service";

@InRequestScope
export class ServiceProvidersService {

	@Inject
	public serviceProvidersRepository: ServiceProvidersRepository;

	@Inject
	public calendarsService: CalendarsService;

	@Inject
	private schedulesService: SchedulesService;

	@Inject
	private timeslotItemsService: TimeslotItemsService;

	@Inject
	private servicesService: ServicesService;

	@Inject
	private timeslotsService: TimeslotsService;

	private static validateServiceProvider(sp: ServiceProviderModel): string[] {
		const errors: string[] = [];
		if (sp.phone && !validatePhoneNumber(sp.phone))
			errors.push(`For service provider: ${sp.name}. Phone number is invalid: ${sp.phone}.`);
		if (sp.email && !validateEmail(sp.email))
			errors.push(`For service provider: ${sp.name}. Email is invalid: ${sp.email}.`);
		return errors;
	}

	private static validateServiceProviders(sps: ServiceProviderModel[]) {
		const errors = sps.map(e => ServiceProvidersService.validateServiceProvider(e)).flat(2);
		if (errors?.length) {
			const molError = new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Bulk of service providers incorrect`);
			const data = {
				errors,
				rules: {
					header: "First line should be: name, email, phone",
					email: "Email should contain @ and .",
					phone: "Phone should follow the format +XX XXXX XXXX or +XXXXXXXXXX"
				}
			};
			molError.setResponseData(data);
			throw molError;
		}
	}

	public async getServiceProviders(serviceId?: number, includeSchedule = false, includeTimeslotsSchedule = false): Promise<ServiceProvider[]> {
		return await this.serviceProvidersRepository.getServiceProviders({
			serviceId,
			includeSchedule,
			includeTimeslotsSchedule
		});
	}

	public async getAvailableServiceProviders(from: Date, to: Date, serviceId?: number): Promise<ServiceProvider[]> {
		const timeslots = await this.timeslotsService.getAggregatedTimeslots(from, to, serviceId, false);

		const availableServiceProviders = new Set<ServiceProvider>();

		timeslots.forEach((timeslot) => {
			timeslot.availableServiceProviders.forEach(provider => {
				availableServiceProviders.add(provider);
			})
		});
		return Array.from(availableServiceProviders);
	}

	public async getServiceProvider(id: number, includeSchedule: boolean, includeTimeslotsSchedule: boolean): Promise<ServiceProvider> {
		const sp = await this.serviceProvidersRepository.getServiceProvider({
			id,
			includeSchedule,
			includeTimeslotsSchedule
		});
		if (!sp) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service provider not found');
		}
		return sp;
	}

	public async saveServiceProviders(listRequest: ServiceProviderModel[], serviceId: number) {
		ServiceProvidersService.validateServiceProviders(listRequest);
		for (let i = 0; i < listRequest.length; i++) {
			await this.saveSp(listRequest[i], serviceId);

			if (i > 0) {
				await this.delay(API_TIMEOUT_PERIOD);
			}
		}
	}

	public async saveSp(item: ServiceProviderModel, serviceId: number) {
		const cal = await this.calendarsService.createCalendar();
		return await this.serviceProvidersRepository.save(ServiceProvider.create(item.name, cal, serviceId, item.email, item.phone));
	}

	public async updateSp(request: ServiceProviderModel, spId: number) {
		const sp = await this.serviceProvidersRepository.getServiceProvider({id: spId});
		if (!sp) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service provider not found');
		}
		ServiceProvidersService.validateServiceProviders([request]);
		sp.email = request.email;
		sp.phone = request.phone;
		sp.name = request.name;
		return await this.serviceProvidersRepository.save(sp);
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
			serviceProvider.timeslotsSchedule = await this.servicesService.getServiceTimeslotsSchedule(serviceProvider.serviceId);
		}
		return serviceProvider.timeslotsSchedule;
	}

	public async addTimeslotItem(serviceProviderId: number, request: TimeslotItemRequest)
		: Promise<TimeslotItem> {
		let serviceProvider = await this.getServiceProvider(serviceProviderId, false, true);
		if (!serviceProvider.timeslotsSchedule) {
			const serviceTimeslotsSchedule = await this.servicesService.getServiceTimeslotsSchedule(serviceProvider.serviceId);
			serviceProvider = await this.copyAndSaveTimeslotsScheduleInServiceProvider(serviceProvider, serviceTimeslotsSchedule.timeslotItems);
		}
		return this.timeslotItemsService.createTimeslotItem(serviceProvider.timeslotsSchedule, request);
	}

	public async updateTimeslotItem(serviceProviderId: number, timeslotId: number, request: TimeslotItemRequest)
		: Promise<TimeslotItem> {
		const serviceProvider = await this.getServiceProvider(serviceProviderId, false, true);
		if (!serviceProvider.timeslotsSchedule) {
			const newItem = TimeslotItem.create(undefined, request.weekDay, TimeOfDay.parse(request.startTime), TimeOfDay.parse(request.endTime));
			const serviceTimeslotsSchedule = await this.servicesService.getServiceTimeslotsSchedule(serviceProvider.serviceId);
			const timeslotItemServiceWithoutTargetItem = serviceTimeslotsSchedule.timeslotItems.filter(t => t._id !== timeslotId);
			timeslotItemServiceWithoutTargetItem.push(newItem);

			await this.copyAndSaveTimeslotsScheduleInServiceProvider(serviceProvider, timeslotItemServiceWithoutTargetItem);
			return newItem;
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
			const serviceTimeslotsSchedule = await this.servicesService.getServiceTimeslotsSchedule(serviceProvider.serviceId);
			const timeslotItemServiceWithoutTargetItem = serviceTimeslotsSchedule.timeslotItems.filter(t => t._id !== timeslotId);

			await this.copyAndSaveTimeslotsScheduleInServiceProvider(serviceProvider, timeslotItemServiceWithoutTargetItem);
			return;
		}
		const timeslotItem = serviceProvider.timeslotsSchedule.timeslotItems.find(t => t._id === timeslotId);
		if (!timeslotItem) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Timeslot item not found');
		}

		await this.timeslotItemsService.deleteTimeslot(timeslotId);
	}

	private delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private async copyAndSaveTimeslotsScheduleInServiceProvider(serviceProvider: ServiceProvider, timeslotItems: TimeslotItem[]): Promise<ServiceProvider> {
		serviceProvider.timeslotsSchedule = TimeslotsSchedule.create(undefined, serviceProvider);

		const items = cloneDeep(timeslotItems);
		items.forEach(i => {
			i._id = undefined;
			i._timeslotsScheduleId = undefined;
			i._timeslotsSchedule = serviceProvider.timeslotsSchedule;
		});
		serviceProvider.timeslotsSchedule.timeslotItems = items;

		return await this.serviceProvidersRepository.save(serviceProvider);
	}

}
