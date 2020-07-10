import { Inject, InRequestScope } from 'typescript-ioc';
import { TimeslotsScheduleRepository } from "./timeslotsSchedule.repository";
import { mapToTimeslotItemResponse, mapToTimeslotsScheduleResponse } from './timeslotItems.mapper';
import { TimeslotItemRequest, TimeslotItemsResponse, TimeslotsScheduleResponse } from './timeslotItems.apicontract';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { ServicesRepository } from '../services/services.repository';
import { TimeslotItemsRepository } from './timeslotItems.repository';
import { TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../models';
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

	private async getServiceTimeslotsSchedule(id: number): Promise<TimeslotsSchedule> {
		if (!id) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service Id should not be empty');
		}

		const service = await this.servicesRepository.getServiceWithTimeslotsSchedule(id);
		if (!service) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
		}

		return service.timeslotsSchedule;
	}

	public async getTimeslotItemsByServiceId(id: number): Promise<TimeslotsScheduleResponse> {
		const timeslotsSchedule = await this.getServiceTimeslotsSchedule(id);
		return mapToTimeslotsScheduleResponse(timeslotsSchedule);
	}

	public async createTimeslotItem(serviceId: number, data: TimeslotItemRequest): Promise<TimeslotItemsResponse> {
		let timeslotSchedule = await this.getServiceTimeslotsSchedule(serviceId);
		if (!timeslotSchedule) {
			timeslotSchedule = await this.createTimeslotsSchedule(serviceId);
		}

		let item: TimeslotItem;
		try {
			item = TimeslotItem.create(timeslotSchedule._id, data.weekDay, TimeOfDay.parse(data.startTime), TimeOfDay.parse(data.endTime));
		} catch (err) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage((err as Error).message);
		}

		if (timeslotSchedule.intersectsAnyExceptThis(item)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Timeslot item overlaps existing entry.');
		}

		return mapToTimeslotItemResponse(await this.timeslotItemsRepository.saveTimeslotItem(item));
	}

	public async updateTimeslotItem(params: { serviceId: number; timeslotId: number; request: TimeslotItemRequest; }): Promise<TimeslotItemsResponse> {
		const { serviceId, timeslotId, request } = params;

		const timeslotsSchedule = await this.getServiceTimeslotsSchedule(serviceId);
		const timeslotItem = timeslotsSchedule?.timeslotItems.find(t => t._id === timeslotId);
		if (!timeslotItem) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Timeslot item not found');
		}

		try {
			timeslotItem._weekDay = request.weekDay;
			timeslotItem._startTime = TimeOfDay.parse(request.startTime);
			timeslotItem._endTime = TimeOfDay.parse(request.startTime);
		} catch (err) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage((err as Error).message);
		}

		if (timeslotsSchedule.intersectsAnyExceptThis(timeslotItem)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Timeslot item overlaps existing entry.');
		}

		return mapToTimeslotItemResponse(await this.timeslotItemsRepository.saveTimeslotItem(timeslotItem));
	}

	private async createTimeslotsSchedule(serviceId: number): Promise<TimeslotsSchedule> {
		const timeslotsScheduleData = new TimeslotsSchedule();
		timeslotsScheduleData._service = serviceId;
		const timeslotsSchedule = await this.timeslotsScheduleRepository.createTimeslotsSchedule(timeslotsScheduleData);
		if (timeslotsSchedule._id) {
			await this.servicesService.setServiceTimeslotsSchedule(serviceId, timeslotsSchedule._id);
		}
		return timeslotsSchedule;

	}

}
