import { CalendarModel } from '../calendars/calendars.apicontract';
import { TimeslotsScheduleResponse } from '../timeslotItems/timeslotItems.apicontract';
import { ScheduleFormResponse } from '../scheduleForms/scheduleForms.apicontract';

export class ServiceProviderModel {
	public name: string;
	public email?: string;
	public phone?: string;

	constructor(name: string, email?: string, phone?: string) {
		this.name = name;
		this.email = email;
		this.phone = phone;
	}
}

export class ServiceProviderResponseModel {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;
	public calendar: CalendarModel;
	/**
	 * @isInt
	 */
	public serviceId: number;
	public timeslotsSchedule?: TimeslotsScheduleResponse;
	public scheduleForm?: ScheduleFormResponse;
	public email?: string;
	public phone?: string;
	public agencyUserId?: string;

	// tslint:disable-next-line
	constructor(
		id: number,
		name: string,
		calendar: CalendarModel,
		serviceId: number,
		timeslotsSchedule?: TimeslotsScheduleResponse,
		scheduleForm?: ScheduleFormResponse,
		email?: string,
		phone?: string,
	) {
		this.id = id;
		this.name = name;
		this.calendar = calendar;
		this.serviceId = serviceId;
		this.timeslotsSchedule = timeslotsSchedule;
		this.scheduleForm = scheduleForm;
		this.email = email;
		this.phone = phone;
	}
}

export class ServiceProviderListRequest {
	public serviceProviders: ServiceProviderModel[];
}

export class SetProviderScheduleFormRequest {
	/**
	 * @isInt
	 */
	public scheduleFormId?: number;
}

export class ServiceProviderSummaryModel {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;

	constructor(id: number, name: string) {
		this.id = id;
		this.name = name;
	}
}
