import { Weekday } from "../enums/weekday";
import { Schedule } from "../models";

export class ScheduleRequest {
	/**
	 * @maxLength 100
	 */
	public name: string;
	public slotsDurationInMin: number;
	public weekdaySchedules: WeekDayScheduleContract[];
}

export class WeekDayScheduleContract {
	public weekday: Weekday;
	public hasSchedule: boolean;
	public openTime?: string;
	public closeTime?: string;
}

export class ScheduleResponse {
	public id: number;
	public name: string;
	public slotsDurationInMin: number;
	public weekdaySchedules: WeekDayScheduleContract[];
}
