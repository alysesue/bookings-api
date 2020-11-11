export class ScheduleFormRequest {
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
	/**
	 * @isInt
	 */
	public weekday: number;
	public hasScheduleForm: boolean;
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

export class ScheduleFormResponse {
	/**
	 * @isInt
	 */
	public id: number;
	/**
	 * @isInt
	 */
	public slotsDurationInMin: number;
	public weekdaySchedules: WeekDayScheduleContract[];
}
