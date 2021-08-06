import { BookingStatus } from '../../models/bookingStatus';
import { PagingRequest } from '../../apicontract';
import { DynamicValueContract, PersistDynamicValueContract } from '../dynamicFields/dynamicValues.apicontract';

export class BookingAcceptRequest {
	/**
	 * @isInt
	 */
	public serviceProviderId: number;
}

export class BookingReject {
	public reasonToReject?: string;
}

export class BookingDetailsRequest {
	/**
	 * An external reference Id for this booking (e.g. external Client Id or booking Id).
	 */
	public refId?: string | null;
	public citizenUinFin?: string | null;
	public citizenName?: string;
	public citizenEmail?: string;
	public citizenPhone?: string | null;
	public location?: string | null;
	public description?: string | null;
	public videoConferenceUrl?: string | null;
	public dynamicValuesUpdated?: boolean;
	public dynamicValues?: PersistDynamicValueContract[];
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
	// default validation type: citizen
	public validationType?: string | null;
}

export class BookingUpdateRequest extends BookingRequest {
	constructor() {
		super();
	}

	public citizenUinFinUpdated?: boolean;
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
	 * For rendering different booking confirmation messages
	 */
	sendNotifications: boolean;
	sendSMSNotifications: boolean;
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
	videoConferenceUrl?: string;
	dynamicValues?: DynamicValueContract[];
	serviceProviderAliasName?: string;
	reasonToReject?: string;
};

export type BookingSearchRequest = {
	from?: Date;
	to?: Date;
	fromCreatedDate?: Date;
	toCreatedDate?: Date;
	statuses?: BookingStatus[];
	serviceId?: number;
	serviceProviderIds?: number[];
	citizenUinFins?: string[];
} & PagingRequest;

export class BookingProviderResponse {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;
}
