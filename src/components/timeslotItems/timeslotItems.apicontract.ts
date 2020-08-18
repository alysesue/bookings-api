export class TimeslotsScheduleResponse {
	public timeslots: TimeslotItemResponse[];
}

export class TimeslotItemResponse {
	public id: number;
	/**
	 * The day of the week: [0, 6] starting from Sunday.
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
}

export class TimeslotItemRequest {
	/**
	 * The day of the week: [0, 6] starting from Sunday.
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
}