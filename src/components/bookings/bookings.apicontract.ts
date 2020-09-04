import { BookingStatus } from '../../models';

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
	public citizenUinFin?: string;
}

export class BookingSearchRequest {
	public from: Date;
	public to: Date;
	public statuses?: BookingStatus[];
	public serviceId?: number;
	public serviceProviderId?: number;
	public citizenUinFins?: string[];

	constructor(from: Date, to: Date, statuses?: BookingStatus[], serviceId?: number, citizenUinFins?: string[]) {
		this.from = from;
		this.to = to;
		this.statuses = statuses;
		this.serviceId = serviceId;
		this.citizenUinFins = citizenUinFins;
	}
}

export class BookingProviderResponse {
	public id: number;
	public name: string;
}
