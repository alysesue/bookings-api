import { ServiceProviderResponse } from "../calendars/calendars.apicontract";

export class BookingAcceptRequest {
	public calendarUUID: string;
}

export class BookingRequest {
	public startDateTime: Date;
	public endDateTime: Date;
}

export class BookingResponse {

	public id: number;
	public status: number;

	public startDateTime: Date;
	public endDateTime: Date;
	public sessionDurationInMinutes: number;
}

export class BookingSearchRequest {
	public status?: number;
	public from: Date;
	public to: Date;


	constructor(from: Date, to: Date, status?: number) {
		this.status = status;
		this.from = from;
		this.to = to;
	}
}

export class BookingRequestResponse {
	public booking: BookingResponse;
	public serviceProviders: ServiceProviderResponse[];
}
