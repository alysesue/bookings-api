export class ScheduleRequest {
	/**
	 * @maxLength 100
	 */
	public name: string;

	/**
	 * @isInt
	 * @minimum 1
	 * @maximum 480
	 */
	public slotsDurationInMin: number;
	public weekdaySchedules: WeekDayScheduleContract[];
}

export class WeekDayBreakContract {
	/**
	 * @maxLength 5
	 */
	public startTime: string;
	/**
	 * @maxLength 5
	 */
	public endTime: string;
}

export class WeekDayScheduleContract {
	public weekday: number;
	public hasSchedule: boolean;
	/**
	 * @maxLength 5
	 */
	public openTime?: string;
	/**
	 * @maxLength 5
	 */
	public closeTime?: string;
	public breaks: WeekDayBreakContract[];
}

export class ScheduleResponse {
	public id: number;
	public name: string;
	public slotsDurationInMin: number;
	public weekdaySchedules: WeekDayScheduleContract[];
}
