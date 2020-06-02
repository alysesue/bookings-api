export class ServiceResponse {
	public id: number;
	public name: string;
}

export class ServiceRequest {
	public name: string;
}

export class SetScheduleRequest {
	public scheduleId?: number;
}
