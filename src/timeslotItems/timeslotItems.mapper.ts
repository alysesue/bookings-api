import { TimeslotsSchedule, TimeslotItem } from "../models";
import { TimeslotItemsResponse } from "./timeslotItems.apicontract";

export const mapToResponse = (data: TimeslotItem[]): TimeslotItemsResponse => {
	if (!data) {
		return null;
	}

	const response = new TimeslotItemsResponse();
	response.timeslots = data;

	return response;
};
