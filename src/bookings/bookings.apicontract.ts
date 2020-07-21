export class BookingAcceptRequest {
	public serviceProviderId: number;
}

export class BookingRequest {
	public startDateTime: Date;
	public endDateTime: Date;
	public serviceProviderId?: number;
	public outOfSlotBooking?: boolean;
}

export class BookingResponse {
	public id: number;
	public status: number;
	public startDateTime: Date;
	public endDateTime: Date;
	public sessionDurationInMinutes: number;
	public serviceId: number;
	public serviceName: string;
	public serviceProviderId?: number;
	public serviceProviderName?: string;
}

export class BookingSearchRequest {
	public serviceId?: number;
	public serviceProviderId?: number;
	public status?: number;
	public from: Date;
	public to: Date;

	constructor(from: Date, to: Date, status?: number, serviceId?: number, serviceProviderId?: number) {
		this.serviceId = serviceId;
		this.serviceProviderId = serviceProviderId;
		this.status = status;
		this.from = from;
		this.to = to;
	}
}

export class BookingProviderResponse {
	public id: number;
	public name: string;
}
