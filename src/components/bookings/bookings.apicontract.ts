import { BookingStatus } from '../../models';
import { PagingRequest } from '../../apicontract';
import { DynamicValueContract, PersistDynamicValueContract } from '../dynamicFields/dynamicValues.apicontract';
import { BookingValidationType } from '../../models/bookingValidationType';

export class BookingAcceptRequestV1 {
	/**
	 * @isInt
	 */
	public serviceProviderId: number;
}

export class BookingAcceptRequestV2 {
	public serviceProviderId: string;
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

export class BookingRequestBase extends BookingDetailsRequest {
	public startDateTime: Date;
	public endDateTime: Date;
	public captchaToken?: string | null;
	// default validation type: citizen
	public validationType?: BookingValidationType | null;
}

export class BookingRequestV1 extends BookingRequestBase {
	/**
	 * @isInt
	 */
	public serviceProviderId?: number;
}

export class BookingRequestV2 extends BookingRequestBase {
	public serviceProviderId?: string;
}

export class BookingUpdateRequestV1 extends BookingRequestBase {
	public citizenUinFinUpdated?: boolean;
	/**
	 * @isInt
	 */
	public serviceProviderId?: number;
}

export class BookingUpdateRequestV2 extends BookingRequestBase {
	public citizenUinFinUpdated?: boolean;
	public serviceProviderId?: string;
}

export class BookingResponseBase {
	/**
	 * @isInt
	 */
	public status: number;
	public createdDateTime: Date;
	public startDateTime: Date;
	public endDateTime: Date;
	public serviceName: string;
	public serviceProviderName?: string;
	public serviceProviderEmail?: string;
	public serviceProviderPhone?: string;
	public serviceProviderAgencyUserId?: string;
	public citizenUinFin?: string;
	public citizenName?: string;
	public citizenEmail?: string;
	public citizenPhone?: string;
	public location?: string;
	public description?: string;
	public refId?: string;
	public videoConferenceUrl?: string;
	public dynamicValues?: DynamicValueContract[];
	public serviceProviderAliasName?: string;
	public reasonToReject?: string;
	/**
	 * For rendering different booking confirmation messages
	 */
	sendNotifications: boolean;
	sendSMSNotifications: boolean;
}

export class BookingResponseV1 extends BookingResponseBase {
	/**
	 * @isInt
	 */
	public id: number;
	/**
	 * @isInt
	 */
	public serviceId: number;
	/**
	 * @isInt
	 */
	public serviceProviderId?: number;
}

export class BookingResponseV2 extends BookingResponseBase {
	public id: string;
	public serviceId: string;
	public serviceProviderId?: string;
}

export class BookingSearchRequest extends PagingRequest {
	public from?: Date;
	public to?: Date;
	public fromCreatedDate?: Date;
	public toCreatedDate?: Date;
	public statuses?: BookingStatus[];
	public serviceId?: number;
	public serviceProviderIds?: number[];
	public citizenUinFins?: string[];
}

export class BookingProviderResponseV1 {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;
}

export class BookingProviderResponseV2 {
	public id: string;
	public name: string;
}
