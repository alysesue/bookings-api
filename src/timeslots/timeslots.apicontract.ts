export class GetTimeslotsFilter {
	public startDate: Date;
	public endDate: Date;
}

export class TimeslotResponse {
	public startTime: Date;
	public endTime: Date;
	public availabilityCount: number;
}
