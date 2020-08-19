import { CalendarModel } from '../calendars/calendars.apicontract';
import { TimeslotsScheduleResponse } from "../timeslotItems/timeslotItems.apicontract";

export class ServiceProviderModel {
	public name: string;
	public email?: string;

	constructor(name: string, email?: string) {
		this.name = name;
		this.email = email;
	}
}

export class ServiceProviderResponseModel {
	public id: number;
	public name: string;
	public calendar: CalendarModel;
	public serviceId: number;
	public timeslotsSchedule?: TimeslotsScheduleResponse;
	public email?: string;


	constructor(id: number, name: string, calendar: CalendarModel, serviceId: number, timeslotsSchedule?: TimeslotsScheduleResponse, email?: string) {
		this.id = id;
		this.name = name;
		this.calendar = calendar;
		this.serviceId = serviceId;
		this.timeslotsSchedule = timeslotsSchedule;
		this.email = email;
	}
}

export class ServiceProviderListRequest {
	public serviceProviders: ServiceProviderModel[];
}

export class SetProviderScheduleRequest {
	public scheduleId?: number;
}

export class ServiceProviderSummaryModel {
	public id: number;
	public name: string;

	constructor(id: number, name: string) {
		this.id = id;
		this.name = name;
	}
}
