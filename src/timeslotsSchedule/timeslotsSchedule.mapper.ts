import { TimeslotsSchedule } from "../models";
import { TimeslotsScheduleResponse } from "./timeslotsSchedule.apicontract";

export const mapToResponse = (data: TimeslotsSchedule): TimeslotsScheduleResponse => {
	if (!data) {
		return null;
	}

	const response = new TimeslotsScheduleResponse();
	response.service = data.service
	response.id = data._timeslotsScheduleId;
	response.timeslots = data.timeslot;

	return response;
};
