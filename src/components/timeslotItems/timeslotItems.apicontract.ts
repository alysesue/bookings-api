export class TimeslotsScheduleResponse {
	public timeslots: TimeslotItemResponse[];
}

export class TimeslotItemResponse {
	/**
	 * @isInt
	 */
	public id: number;
	/**
	 * The day of the week: [0, 6] starting from Sunday.
	 * @isInt
	 */
	public weekDay: number;
	/**
	 * The timeslot's start time in 24 hour format: HH:mm
	 */
	public startTime: string;
	/**
	 * The timeslot's end time in 24 hour format: HH:mm
	 */
	public endTime: string;
	/**
	 * The number of capacity for this timeslot
	 * @isInt
	 */
	public capacity: number;
}

export class TimeslotItemRequest {
	/**
	 * The day of the week: [0, 6] starting from Sunday.
	 * @isInt
	 */
	public weekDay: number;
	/**
	 * The timeslot's start time in 24 hour format: HH:mm
	 */
	public startTime: string;
	/**
	 * The timeslot's end time in 24 hour format: HH:mm
	 */
	public endTime: string;
	/**
	 * The number of capacity for this timeslot
	 * @isInt
	 */
	public capacity: number = 1;
}
