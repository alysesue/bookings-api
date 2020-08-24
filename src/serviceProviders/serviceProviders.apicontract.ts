import { CalendarModel } from '../calendars/calendars.apicontract';
import { TimeslotsScheduleResponse } from "../timeslotItems/timeslotItems.apicontract";
import { BookingResponse } from "../bookings/bookings.apicontract";

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
	public timeslotsSchedule?: TimeslotsScheduleResponse;


	constructor(id: number, name: string, calendar: CalendarModel, serviceId: number, timeslotsSchedule?: TimeslotsScheduleResponse) {
		this.id = id;
		this.name = name;
		this.calendar = calendar;
		this.serviceId = serviceId;
		this.timeslotsSchedule = timeslotsSchedule;
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
	public bookings?: BookingResponse[];

	constructor(id: number, name: string, bookings?: BookingResponse[]) {
		this.id = id;
		this.name = name;
		this.bookings = bookings;
	}
}
