import * as _ from "lodash";
import { Inject, InRequestScope } from 'typescript-ioc';
import { TimeslotsScheduleRepository } from "../timeslotsSchedules/timeslotsSchedule.repository";
import { mapTimeslotItemToEntity } from './timeslotItems.mapper';
import { TimeslotItemRequest } from './timeslotItems.apicontract';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { TimeslotItemsRepository } from './timeslotItems.repository';
import { TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../models';
import { DeleteResult } from "typeorm";

@InRequestScope
export class TimeslotItemsService {
	@Inject
	private timeslotsScheduleRepository: TimeslotsScheduleRepository;
	@Inject
	private timeslotItemsRepository: TimeslotItemsRepository;

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

	public async mapAndSaveTimeslotItem(timeslotsSchedule: TimeslotsSchedule, request: TimeslotItemRequest, entity: TimeslotItem) : Promise<TimeslotItem> {
		const item = this.mapItemAndValidate(timeslotsSchedule, request, entity);
		return await this.timeslotItemsRepository.saveTimeslotItem(item);
	}

	public async updateTimeslotItem(timeslotsSchedule: TimeslotsSchedule, timeslotId: number, request: TimeslotItemRequest)
		: Promise<TimeslotItem> {

		const timeslotItem = timeslotsSchedule?.timeslotItems.find(t => t._id === timeslotId);
		if (!timeslotItem) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Timeslot item not found');
		}

		return this.mapAndSaveTimeslotItem(timeslotsSchedule, request, timeslotItem);
	}

	public async createTimeslotItem(timeslotsSchedule: TimeslotsSchedule, request: TimeslotItemRequest) : Promise<TimeslotItem> {
		return this.mapAndSaveTimeslotItem(timeslotsSchedule, request, new TimeslotItem());
	}

	public async deleteTimeslot(timeslotId: number): Promise<DeleteResult>{
		return await this.timeslotItemsRepository.deleteTimeslotItem(timeslotId);
	}

	public async mapAndSaveTimeslotItemsToTimeslotsSchedule(timeslotsItemService: TimeslotItem[], timeslotsScheduleSP: TimeslotsSchedule)
		:Promise<TimeslotItem[]>{
		const timeslotsItemServiceClone = _.cloneDeep(timeslotsItemService);
		if (timeslotsItemServiceClone) {
			timeslotsItemServiceClone.forEach(e => {
				delete e._id;
				e._timeslotsSchedule = timeslotsScheduleSP;
			});
		}
		return await this.timeslotItemsRepository.saveTimeslotItems(timeslotsItemServiceClone);
	}
}
