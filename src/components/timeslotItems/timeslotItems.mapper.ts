import { TimeOfDay, TimeslotItem, TimeslotsSchedule } from "../../models";
import { TimeslotItemRequest, TimeslotItemResponse, TimeslotsScheduleResponse } from "./timeslotItems.apicontract";


const mapTimeslotItems = (data: TimeslotItem[]): TimeslotItemResponse[] => {
	return data.map(i => {
		const item = new TimeslotItemResponse();
		item.id = i._id;
		item.weekDay = i._weekDay;
		item.startTime = i._startTime.toString();
		item.endTime = i._endTime.toString();
		return item;
	});
};


export const mapToTimeslotsScheduleResponse = (data: TimeslotsSchedule)
	: TimeslotsScheduleResponse => {
	if (!data) {
		return null;
	}

	const response = new TimeslotsScheduleResponse();
	response.timeslots = mapTimeslotItems(data.timeslotItems);

	return response;
};

export const mapToTimeslotItemResponse = (data: TimeslotItem): TimeslotItemResponse => {
	if (!data) {
		return null;
	}

	const response = new TimeslotItemResponse();
	response.id = data._id;
	response.weekDay = data._weekDay;
	response.startTime = data._startTime.toString();
	response.endTime = data._endTime.toString();

	return response;
};

export const mapTimeslotItemToEntity = (request: TimeslotItemRequest, entity: TimeslotItem): TimeslotItem => {
	entity._weekDay = request.weekDay;
	entity._startTime = TimeOfDay.parse(request.startTime);
	entity._endTime = TimeOfDay.parse(request.endTime);
	return entity;
};
