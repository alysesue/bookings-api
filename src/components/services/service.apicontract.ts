export class ServiceResponse {
	public id: number;
	public name: string;
}

export class ServiceRequest {
	public name: string;
	public organisationId?: number;
}

export class SetScheduleFormRequest {
	public scheduleFormId?: number;
}
