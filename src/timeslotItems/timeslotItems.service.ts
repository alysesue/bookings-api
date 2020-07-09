import { Inject, InRequestScope } from 'typescript-ioc';
import { TimeslotsScheduleRepository } from "./timeslotsSchedule.repository";
import { mapToTimeslotsScheduleResponse, mapToTimeslotItemResponse } from './timeslotItems.mapper';
import { TimeslotsScheduleResponse, TimeslotItemRequest, TimeslotItemsResponse } from './timeslotItems.apicontract';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { ServicesRepository } from '../services/services.repository';
import { TimeslotItemsRepository } from './timeslotItems.repository';
import { TimeslotItem, TimeOfDay, TimeslotsSchedule } from '../models';
import { ServicesService } from '../services/services.service';

@InRequestScope
export class TimeslotItemsService {
	@Inject
	private timeslotsScheduleRepository: TimeslotsScheduleRepository;
	@Inject
	private timeslotItemsRepository: TimeslotItemsRepository;
	@Inject
	private servicesRepository: ServicesRepository;

	@Inject
	private servicesService: ServicesService;

	public async getTimeslotItemsByServiceId(id: number): Promise<TimeslotsScheduleResponse> {
		if (!id) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service Id should not be empty');
		}

		const service = await this.servicesRepository.getService(id);
		if (!service) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
		}
		return mapToTimeslotsScheduleResponse(await this.timeslotsScheduleRepository.getTimeslotsScheduleById(service._timeslotsScheduleId));
	}

	public async createTimeslotItem(serviceId: number, data: TimeslotItemRequest): Promise<TimeslotItemsResponse> {
		if (!serviceId) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service Id should not be empty');
		}

		const service = await this.servicesRepository.getService(serviceId);
		if (!service) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
		}

		let timeslotScheduleId = service._timeslotsScheduleId;
		if (!service._timeslotsScheduleId) {
			timeslotScheduleId = (await this.createTimeslotsSchedule(serviceId))._id;
		}


		const item = TimeslotItem.create(timeslotScheduleId, data.weekDay, TimeOfDay.parse(data.startTime), TimeOfDay.parse(data.endTime));
		return mapToTimeslotItemResponse(await this.timeslotItemsRepository.saveTimeslotItem(item));
	}

	private async createTimeslotsSchedule(serviceId: number): Promise<TimeslotsSchedule> {
		const timeslotsScheduleData = new TimeslotsSchedule();
		timeslotsScheduleData._service = serviceId;
		const timeslotsSchedule = await this.timeslotsScheduleRepository.createTimeslotsSchedule(timeslotsScheduleData);
		if (timeslotsSchedule._id) {
			await this.servicesService.setServiceTimeslotsSchedule(serviceId, timeslotsSchedule._id);
		}
		return timeslotsSchedule

	}

}
