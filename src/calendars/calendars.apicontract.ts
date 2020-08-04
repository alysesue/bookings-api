import { Schedule } from "../models";

export class CalendarModel {
	public uuid: string;
	public externalCalendarUrl: string;
	public caldavUserUrl: string;
	public caldavEventsUrl: string;
	public serviceProviderName: string;
}

export class CalendarUserModel {
	/**
	 * Google account email address
	 */
	public email: string;
	/**
	 * Role: reader or writer.
	 */
	public role: string;
}

export class ServiceProviderResponse {
	public uuid: string;
}

export class CalendarScheduleResponse {
	public id: number;

	constructor(template: Schedule) {
		this.id = template.id;
	}
}
