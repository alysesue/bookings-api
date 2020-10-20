import { CalendarModel } from '../calendars/calendars.apicontract';
import { TimeslotsScheduleResponse } from '../timeslotItems/timeslotItems.apicontract';
import { BookingResponse } from '../bookings/bookings.apicontract';
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
	public id: number;
	public name: string;
	public calendar: CalendarModel;
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
export class ServiceProviderWithBookingsModel {
	public id: number;
	public name: string;
	public acceptedBookings?: BookingResponse[];
	public pendingBookings?: BookingResponse[];

	constructor(id: number, name: string, acceptedBookings?: BookingResponse[], pendingBookings?: BookingResponse[]) {
		this.id = id;
		this.name = name;
		this.acceptedBookings = acceptedBookings;
		this.pendingBookings = pendingBookings;
	}
}
