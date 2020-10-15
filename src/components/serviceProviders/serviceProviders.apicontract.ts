import { CalendarModel } from '../calendars/calendars.apicontract';
import { TimeslotsScheduleResponse } from '../timeslotItems/timeslotItems.apicontract';
import { BookingResponse } from '../bookings/bookings.apicontract';

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
	public id: number;
	public name: string;
	public calendar: CalendarModel;
	public serviceId: number;
	public timeslotsSchedule?: TimeslotsScheduleResponse;
	public email?: string;
	public phone?: string;
	public agencyUserId?: string;

	constructor(
		id: number,
		name: string,
		calendar: CalendarModel,
		serviceId: number,
		timeslotsSchedule?: TimeslotsScheduleResponse,
		email?: string,
		phone?: string,
	) {
		this.id = id;
		this.name = name;
		this.calendar = calendar;
		this.serviceId = serviceId;
		this.timeslotsSchedule = timeslotsSchedule;
		this.email = email;
		this.phone = phone;
	}
}

export class ServiceProviderListRequest {
	public serviceProviders: ServiceProviderModel[];
}

export class SetProviderScheduleFormRequest {
	public scheduleFormId?: number;
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
