import { Schedule } from "../models";

export class CalendarModel {
	public uuid: string;
	public externalCalendarUrl: string;
	public caldavUserUrl: string;
	public caldavEventsUrl: string;
	public serviceProviderName: string;
}

export class AddCalendarModel {
	/**
	 * @maxLength 100
	 */
	public serviceProviderName: string;
}

export class CalendarUserModel {
	public email: string;
	public role: string;
}

export class ServiceProviderResponse {
	public serviceProviderName: string;
	public uuid: string;
}

export class CalendarTemplatesTimeslotModel {
	public templatesTimeslotId: number;
}

export class CalendarScheduleResponse {
	public id: number;

	constructor(template: Schedule) {
		this.id = template.id;
	}
}
