import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";
import { Inject, InRequestScope, Scope, Scoped } from "typescript-ioc";
import { Schedule, Service, TimeslotsSchedule } from "../models";
import { ServicesRepository } from "./services.repository";
import { ServiceRequest, SetScheduleRequest } from "./service.apicontract";
import { SchedulesService } from '../schedules/schedules.service';

@InRequestScope
export class ServicesService {

	@Inject
	private servicesRepository: ServicesRepository;

	@Inject
	private schedulesService: SchedulesService;

	public async createService(request: ServiceRequest): Promise<Service> {
		const service = new Service();
		service.name = request.name;

		return await this.servicesRepository.save(service);
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

	public async setServiceTimeslotsSchedule(id: number, timeslotsScheduleId: number): Promise<TimeslotsSchedule> {
		const service = await this.servicesRepository.getService(id);
		if (!service) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
		}
		service._timeslotsScheduleId = timeslotsScheduleId;
		await this.servicesRepository.save(service);
		return service._timeslotsSchedule;
	}


}
