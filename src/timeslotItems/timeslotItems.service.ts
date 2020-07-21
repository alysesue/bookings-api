import * as _ from "lodash";
import { Inject, InRequestScope } from 'typescript-ioc';
import { TimeslotsScheduleRepository } from "./timeslotsSchedule.repository";
import { mapTimeslotItemToEntity, mapToTimeslotItemResponse, mapToTimeslotsScheduleResponse } from './timeslotItems.mapper';
import { TimeslotItemRequest, TimeslotItemsResponse, TimeslotsScheduleResponse } from './timeslotItems.apicontract';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { ServicesRepository } from '../services/services.repository';
import { TimeslotItemsRepository } from './timeslotItems.repository';
import { TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../models';
import { ServicesService } from '../services/services.service';
import { ServiceProvidersRepository } from "../serviceProviders/serviceProviders.repository";
import { ServiceProvidersService } from "../serviceProviders/serviceProviders.service";

@InRequestScope
export class TimeslotItemsService {
	@Inject
	private timeslotsScheduleRepository: TimeslotsScheduleRepository;
	@Inject
	private timeslotItemsRepository: TimeslotItemsRepository;
	@Inject
	private servicesRepository: ServicesRepository;
	@Inject
	private serviceProvidersRepository: ServiceProvidersRepository;

	@Inject
	private servicesProvidersRepository: ServiceProvidersRepository;

	@Inject
	private servicesService: ServicesService;

	@Inject
	private serviceProvidersService: ServiceProvidersService;

	private async getServiceTimeslotsSchedule(id: number): Promise<TimeslotsSchedule> {
		const service = await this.servicesRepository.getServiceWithTimeslotsSchedule(id);
		if (!service) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
		}

		return service.timeslotsSchedule;
	}

	private async getServiceProviderTimeslotsSchedule(id: number): Promise<TimeslotsSchedule> {
		if (!id) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service Provider Id should not be empty');
		}

		const serviceProvider = await this.servicesProvidersRepository.getServiceProvider({id, includeTimeslotsSchedule: true});
		if (!serviceProvider) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service provider not found');
		}

		return serviceProvider.timeslotsSchedule;
	}

	public async getTimeslotItemsByServiceId(id: number): Promise<TimeslotsScheduleResponse> {
		const timeslotsSchedule = await this.getServiceTimeslotsSchedule(id);
		return mapToTimeslotsScheduleResponse(timeslotsSchedule);
	}

	public async getTimeslotItemsByServiceProviderId(id: number): Promise<TimeslotsScheduleResponse> {
		const timeslotsSchedule = await this.getServiceProviderTimeslotsSchedule(id);
		return mapToTimeslotsScheduleResponse(timeslotsSchedule);
	}

	private mapItemAndValidate(timeslotsSchedule: TimeslotsSchedule, request: TimeslotItemRequest, entity: TimeslotItem): TimeslotItem {
		entity._timeslotsScheduleId = timeslotsSchedule._id;
		try {
			mapTimeslotItemToEntity(request, entity);
		} catch (err) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage((err as Error).message);
		}

		if (TimeOfDay.compare(entity.startTime, entity.endTime) >= 0) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Timeslot start time must be less than end time.');
		}

		if (timeslotsSchedule.intersectsAnyExceptThis(entity)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Timeslot item overlaps existing entry.');
		}

		return entity;
	}

	public async createTimeslotItem(serviceId: number, request: TimeslotItemRequest): Promise<TimeslotItemsResponse> {
		let timeslotsSchedule = await this.getServiceTimeslotsSchedule(serviceId);
		if (!timeslotsSchedule) {
			timeslotsSchedule = await this.createTimeslotsSchedule(serviceId);
		}

		const item = this.mapItemAndValidate(timeslotsSchedule, request, new TimeslotItem());
		return mapToTimeslotItemResponse(await this.timeslotItemsRepository.saveTimeslotItem(item));
	}

	public async createTimeslotItemForServiceProvider(serviceProviderId: number, request: TimeslotItemRequest): Promise<TimeslotItemsResponse> {
		let timeslotsSchedule = await this.getServiceProviderTimeslotsSchedule(serviceProviderId);
		if (!timeslotsSchedule) {
			timeslotsSchedule = await this.createTimeslotsScheduleForServiceProvider(serviceProviderId);
			const serviceProvider = await this.serviceProvidersService.getServiceProvider(serviceProviderId);
			timeslotsSchedule.timeslotItems = await this.copyTimeslotScheduleServiceToServiceProvider(serviceProvider.serviceId, timeslotsSchedule);
		}
		const item = this.mapItemAndValidate(timeslotsSchedule, request, new TimeslotItem());
		return mapToTimeslotItemResponse(await this.timeslotItemsRepository.saveTimeslotItem(item));
	}

	public async updateTimeslotItem({ serviceId, timeslotId, request }:
		{ serviceId: number; timeslotId: number; request: TimeslotItemRequest; })
		: Promise<TimeslotItemsResponse> {

		const timeslotsSchedule = await this.getServiceTimeslotsSchedule(serviceId);
		const timeslotItem = timeslotsSchedule?.timeslotItems.find(t => t._id === timeslotId);
		if (!timeslotItem) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Timeslot item not found');
		}

		this.mapItemAndValidate(timeslotsSchedule, request, timeslotItem);
		return mapToTimeslotItemResponse(await this.timeslotItemsRepository.saveTimeslotItem(timeslotItem));
	}

	private async copyTimeslotScheduleServiceToServiceProvider(serviceId: number, timeslotsSchedule: TimeslotsSchedule):Promise<TimeslotItem[]>{
		const timeslotsScheduleService = await this.getServiceTimeslotsSchedule(serviceId);
		const timeslotsScheduleServiceClone = _.cloneDeep(timeslotsScheduleService);
		timeslotsScheduleServiceClone.timeslotItems.forEach(e=> {
			delete e._id;
			e._timeslotsSchedule = timeslotsSchedule;
		});
		return await this.timeslotItemsRepository.saveTimeslotItems(timeslotsScheduleServiceClone.timeslotItems);
	}

	public async deleteTimeslot(timeslotId: number) {
		await this.timeslotItemsRepository.deleteTimeslotItem(timeslotId);
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

	private async createTimeslotsScheduleForServiceProvider(serviceProviderId: number): Promise<TimeslotsSchedule> {
		const timeslotsScheduleData = new TimeslotsSchedule();
		timeslotsScheduleData._serviceProvider = serviceProviderId;
		const timeslotsSchedule = await this.timeslotsScheduleRepository.createTimeslotsSchedule(timeslotsScheduleData);
		if (timeslotsSchedule._id) {
			await this.serviceProvidersService.setServiceTimeslotsSchedule(serviceProviderId, timeslotsSchedule._id);
		}

		return timeslotsSchedule;
	}
}
