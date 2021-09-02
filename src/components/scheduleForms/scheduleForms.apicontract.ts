export class ScheduleFormRequest {
	/**
	 * @isInt
	 * @minimum 1
	 * @maximum 480
	 */
	public slotsDurationInMin: number;
	public serviceProvidersEmailList: string[] = [];
	/**
	 * Propagated to WeekDayScheduleContract
	 *
	 * @isDate
	 */
	public startDate?: Date;
	/**
	 * Propagated to WeekDayScheduleContract
	 *
	 * @isDate
	 */
	public endDate?: Date;
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
	/**
	 * The number of capacity for this timeslot
	 *
	 * @isInt
	 */
	public capacity = 1;
	/**
	 * Propagated from ScheduleFormRequest
	 *
	 * @isDate
	 */
	public startDate?: Date;
	/**
	 * Propagated from ScheduleFormRequest
	 *
	 * @isDate
	 */
	public endDate?: Date;
}

export class ScheduleFormResponseBase {
	/**
	 * @isInt
	 */
	public slotsDurationInMin: number;
	/**
	 * Schedule Start Date
	 *
	 * @isDate
	 */
	public startDate?: Date;
	/**
	 * Schedule End Date
	 *
	 * @isDate
	 */
	public endDate?: Date;
	public weekdaySchedules: WeekDayScheduleContract[];
}

export class ScheduleFormResponseV1 extends ScheduleFormResponseBase {
	/**
	 * @isInt
	 */
	public id: number;
}

export class ScheduleFormResponseV2 extends ScheduleFormResponseBase {
	public id: string;
}
