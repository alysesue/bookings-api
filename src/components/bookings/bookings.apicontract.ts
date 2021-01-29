import { BookingStatus, ServiceProvider } from '../../models';

export class BookingAcceptRequest {
	/**
	 * @isInt
	 */
	public serviceProviderId: number;
}

export class BookingDetailsRequest {
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
}

export class BookingRequest extends BookingDetailsRequest {
	constructor() {
		super();
	}
	public startDateTime: Date;
	public endDateTime: Date;
	/**
	 * @isInt
	 */
	public serviceProviderId?: number;
	public captchaToken?: string | null;
	/**
	 * @ignore
	 */
	public captchaOrigin?: string | null;
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
	createdDateTime: Date;
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

export type BookingSearchRequest = {
	from?: Date;
	to?: Date;
	fromCreatedDate?: Date;
	toCreatedDate?: Date;
	statuses?: BookingStatus[];
	serviceId?: number;
	serviceProviderId?: number;
	citizenUinFins?: string[];
};

export class BookingProviderResponse {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;
}
