import { Service, TimeslotItem } from "../models";

export class TimeslotsScheduleResponse {
	public id: number;
	public service: Service;
	public timeslots: TimeslotItem[];

}
