import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";
import { Inject, InRequestScope } from "typescript-ioc";
import { Schedule, Service, TimeslotItem, TimeslotsSchedule } from "../../models";
import { ServicesRepository } from "./services.repository";
import { ServiceRequest, SetScheduleRequest } from "./service.apicontract";
import { SchedulesService } from '../schedules/schedules.service';
import { TimeslotItemRequest } from "../timeslotItems/timeslotItems.apicontract";
import { TimeslotItemsService } from "../timeslotItems/timeslotItems.service";
import { TimeslotsScheduleService } from "../timeslotsSchedules/timeslotsSchedule.service";

@InRequestScope
export class ServicesService {

	@Inject
	private servicesRepository: ServicesRepository;

	@Inject
	private schedulesService: SchedulesService;

	@Inject
	private timeslotItemsService: TimeslotItemsService;

	@Inject
	private timeslotsScheduleService: TimeslotsScheduleService;

	public async createService(request: ServiceRequest): Promise<Service> {
		const service = new Service();
		service.name = request.name;

		return await this.servicesRepository.save(service);
	}

	public async updateService(id: number, request: ServiceRequest): Promise<Service> {
		try {

			const service = await this.servicesRepository.getService(id);
			if (!service)
				throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
			service.name = request.name;
			return await this.servicesRepository.save(service);
		} catch (e) {
			if (e.message.startsWith('duplicate key value violates unique constraint'))
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Service name is already present');
			throw e;
		}
	}

	public async setServiceSchedule(id: number, model: SetScheduleRequest): Promise<Schedule> {
		const service = await this.servicesRepository.getService(id);
		if (!service) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
		}

		let schedule: Schedule = null;
		if (model.scheduleId) {
			schedule = await this.schedulesService.getSchedule(model.scheduleId);
			if (!schedule) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Schedule not found');
			}
		}

		service.schedule = schedule;
		await this.servicesRepository.save(service);
		return schedule;
	}

	public async getServiceSchedule(id: number): Promise<Schedule> {
		const service = await this.servicesRepository.getService(id);
		if (!service) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
		}

		let schedule: Schedule = null;
		if (service.scheduleId) {
			schedule = await this.schedulesService.getSchedule(service.scheduleId);
		}

		if (!schedule) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service schedule not found');
		}

		return schedule;
	}

	public async getServices(): Promise<Service[]> {
		return await this.servicesRepository.getAll();
	}

	public async getService(id: number): Promise<Service> {
		return await this.servicesRepository.getService(id);
	}

	public async getServiceTimeslotsSchedule(id: number): Promise<TimeslotsSchedule> {
		const service = await this.getService(id);
		return await this.timeslotsScheduleService.getTimeslotsScheduleById(service.timeslotsScheduleId);
	}

	public async addTimeslotItem(serviceId: number, request: TimeslotItemRequest): Promise<TimeslotItem> {
		let timeslotsSchedule = await this.getServiceTimeslotsSchedule(serviceId);
		if (!timeslotsSchedule) {
			timeslotsSchedule = await this.createTimeslotsSchedule(serviceId);
		}
		return this.timeslotItemsService.createTimeslotItem(timeslotsSchedule, request);
	}

	public async deleteTimeslotsScheduleItem(timeslotId: number) {
		await this.timeslotItemsService.deleteTimeslot(timeslotId);
	}

	public async updateTimeslotItem({ serviceId, timeslotId, request }
		                                : { serviceId: number; timeslotId: number; request: TimeslotItemRequest; })
		: Promise<TimeslotItem> {
		const timeslotsSchedule = await this.getServiceTimeslotsSchedule(serviceId);
		return this.timeslotItemsService.updateTimeslotItem(timeslotsSchedule, timeslotId, request);
	}

	private async createTimeslotsSchedule(serviceId: number): Promise<TimeslotsSchedule> {
		const service = await this.servicesRepository.getService(serviceId);
		if (!service) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
		}
		service.timeslotsSchedule = TimeslotsSchedule.create(service, undefined);
		await this.servicesRepository.save(service);
		return service.timeslotsSchedule;
	}
}
