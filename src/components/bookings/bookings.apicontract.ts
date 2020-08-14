import { BookingStatus } from "../../models";

export class BookingAcceptRequest {
	public serviceProviderId: number;
}

export class BookingRequest {
	public startDateTime: Date;
	public endDateTime: Date;
	public serviceProviderId?: number;
	/**
	 * @ignore
	 */
	public outOfSlotBooking?: boolean;
	/**
	 * An external reference Id for this booking (e.g. external Client Id or booking Id).
	 */
	public refId?: string;
}

export class BookingResponse {
	public id: number;
	public status: number;
	public startDateTime: Date;
	public endDateTime: Date;
	public serviceId: number;
	public serviceName: string;
	public serviceProviderId?: number;
	public serviceProviderName?: string;
}

export class BookingSearchRequest {
	public serviceId?: number;
	public serviceProviderId?: number;
	public statuses?: BookingStatus[];
	public from: Date;
	public to: Date;

	constructor(from: Date, to: Date, status?: BookingStatus[], serviceId?: number, serviceProviderId?: number) {
		this.serviceId = serviceId;
		this.serviceProviderId = serviceProviderId;
		this.statuses = status;
		this.from = from;
		this.to = to;
	}
}

export class BookingProviderResponse {
	public id: number;
	public name: string;
}
