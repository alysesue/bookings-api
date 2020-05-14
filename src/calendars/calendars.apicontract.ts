import { TemplateTimeslots } from "../models";

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

export class CalendarTemplatesTimeslotModel {
	public id: number;
}

export class CalendarTemplateTimeslotResponse {
	public id: number;

	constructor(template: TemplateTimeslots) {
		this.id = template.id;
	}
}