import { BookingStatus, ServiceProvider } from '../../models';

export class BookingAcceptRequest {
	/**
	 * @isInt
	 */
	public serviceProviderId: number;
}

export class BookingRequest {
	public startDateTime: Date;
	public endDateTime: Date;
	/**
	 * @isInt
	 */
	public serviceProviderId?: number;
	/**
	 * @ignore
	 */
	public outOfSlotBooking?: boolean;
	/**
	 * An external reference Id for this booking (e.g. external Client Id or booking Id).
	 */
	public refId?: string | null;
	public citizenUinFin?: string;
	public citizenName?: string;
	public citizenEmail?: string;
	public citizenPhone?: string | null;
	public location?: string | null;
	public description?: string | null;
	public captchaToken?: string | null;
}

export interface RescheduleBookingRequest extends BookingRequest {
	status: BookingStatus;
	serviceProvider: ServiceProvider;
}

export type BookingResponse = {
	/**
	 * @isInt
	 */
	id: number;
	/**
	 * @isInt
	 */
	status: number;
	startDateTime: Date;
	endDateTime: Date;
	/**
	 * @isInt
	 */
	serviceId: number;
	serviceName: string;
	/**
	 * @isInt
	 */
	serviceProviderId?: number;
	serviceProviderName?: string;
	serviceProviderEmail?: string;
	serviceProviderPhone?: string;
	serviceProviderAgencyUserId?: string;
	citizenUinFin?: string;
	citizenName?: string;
	citizenEmail?: string;
	citizenPhone?: string;
	location?: string;
	description?: string;
	refId?: string;
};

export class BookingSearchRequest {
	public from: Date;
	public to: Date;
	public statuses?: BookingStatus[];
	/**
	 * @isInt
	 */
	public serviceId?: number;
	/**
	 * @isInt
	 */
	public serviceProviderId?: number;
	public citizenUinFins?: string[];

	constructor(
		from: Date,
		to: Date,
		statuses?: BookingStatus[],
		serviceId?: number,
		citizenUinFins?: string[],
		serviceProviderId?: number,
	) {
		this.from = from;
		this.to = to;
		this.statuses = statuses;
		this.serviceId = serviceId;
		this.citizenUinFins = citizenUinFins;
		this.serviceProviderId = serviceProviderId;
	}
}

export class BookingProviderResponse {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;
}
