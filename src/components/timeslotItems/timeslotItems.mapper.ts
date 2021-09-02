import { TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../../models';
import {
	TimeslotItemRequest,
	TimeslotItemResponseV1,
	TimeslotItemResponseV2,
	TimeslotsScheduleResponseV1,
	TimeslotsScheduleResponseV2,
} from './timeslotItems.apicontract';
import { Inject } from 'typescript-ioc';
import { IdHasher } from '../../infrastructure/idHasher';

export class TimeslotItemsMapper {
	@Inject
	private idHasher: IdHasher;

	private mapTimeslotItemsV1(data: TimeslotItem[]): TimeslotItemResponseV1[] {
		return data.map((i) => {
			const item = new TimeslotItemResponseV1();
			item.id = i._id;
			item.weekDay = i._weekDay;
			item.startTime = i._startTime.toString();
			item.endTime = i._endTime.toString();
			item.capacity = i._capacity;
			item.startDate = i._startDate;
			item.endDate = i._endDate;
			return item;
		});
	}

	private mapTimeslotItemsV2(data: TimeslotItem[]): TimeslotItemResponseV2[] {
		return data.map((i) => {
			const item = new TimeslotItemResponseV2();
			item.id = this.idHasher.encode(i._id);
			item.weekDay = i._weekDay;
			item.startTime = i._startTime.toString();
			item.endTime = i._endTime.toString();
			item.capacity = i._capacity;
			item.startDate = i._startDate;
			item.endDate = i._endDate;
			return item;
		});
	}

	public mapToTimeslotsScheduleResponseV1(data: TimeslotsSchedule): TimeslotsScheduleResponseV1 {
		const response = new TimeslotsScheduleResponseV1();
		response.timeslots = data?.timeslotItems ? this.mapTimeslotItemsV1(data.timeslotItems) : [];

		return response;
	}

	public mapToTimeslotsScheduleResponseV2(data: TimeslotsSchedule): TimeslotsScheduleResponseV2 {
		const response = new TimeslotsScheduleResponseV2();
		response.timeslots = data?.timeslotItems ? this.mapTimeslotItemsV2(data.timeslotItems) : [];

		return response;
	}

	public mapToTimeslotItemResponseV1 = (data: TimeslotItem): TimeslotItemResponseV1 => {
		if (!data) {
			return null;
		}

		const response = new TimeslotItemResponseV1();
		response.id = data._id;
		response.weekDay = data._weekDay;
		response.startTime = data._startTime.toString();
		response.endTime = data._endTime.toString();
		response.capacity = data._capacity;

		return response;
	};

	public mapToTimeslotItemResponseV2 = (data: TimeslotItem): TimeslotItemResponseV2 => {
		if (!data) {
			return null;
		}

		const signedId = this.idHasher.encode(data._id);

		const response = new TimeslotItemResponseV2();
		response.id = signedId;
		response.weekDay = data._weekDay;
		response.startTime = data._startTime.toString();
		response.endTime = data._endTime.toString();
		response.capacity = data._capacity;

		return response;
	};

	public mapTimeslotItemToEntity = (request: TimeslotItemRequest, entity: TimeslotItem): TimeslotItem => {
		entity._weekDay = request.weekDay;
		entity._startTime = TimeOfDay.parse(request.startTime);
		entity._endTime = TimeOfDay.parse(request.endTime);
		entity._capacity = request.capacity;
		return entity;
	};
}
