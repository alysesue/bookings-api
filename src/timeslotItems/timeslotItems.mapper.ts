import { TimeslotItem, TimeslotsSchedule } from "../models";
import { TimeslotItemResponse, TimeslotsScheduleResponse } from "./timeslotItems.apicontract";


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


export const mapToResponse = (data: TimeslotsSchedule): TimeslotsScheduleResponse => {
	if (!data) {
		return null;
	}

	const response = new TimeslotsScheduleResponse();
	response.timeslots = mapTimeslotItems(data.timeslotItems);

	return response;
};
