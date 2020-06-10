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

	constructor(id: number, name: string, calendar: CalendarModel) {
		this.id = id;
		this.name = name;
		this.calendar = calendar;
	}
}

export class ServiceProviderListRequest {
	public serviceProviders: ServiceProviderModel[];
}
