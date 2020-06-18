import { CalendarModel } from '../calendars/calendars.apicontract';

export class ServiceProviderModel {
	public name: string;

	constructor(name: string) {
		this.name = name;
	}
}

export class ServiceProviderResponseModel {
	public id: number;
	public name: string;
	public calendar: CalendarModel;
	public serviceId: number;

	constructor(id: number, name: string, calendar: CalendarModel, serviceId: number) {
		this.id = id;
		this.name = name;
		this.calendar = calendar;
		this.serviceId = serviceId;
	}
}

export class ServiceProviderListRequest {
	public serviceProviders: ServiceProviderModel[];
}

export class SetProviderScheduleRequest {
	public scheduleId?: number;
}
