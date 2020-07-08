import { Weekday } from "../enums/weekday";

export class TimeslotsScheduleResponse {
	public timeslots: TimeslotItemResponse[];

}

export class TimeslotItemResponse {
	public id: number;
	public weekDay: Weekday;
	public startTime: string;
	public endTime: string;
}
