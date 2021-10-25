import { BookingStatus, BookingValidationType, BookingWorkflowType, Salutations } from '../../models/enums';
import { PagingRequest } from '../../apicontract';
import { PersistDynamicValueContract, DynamicValueContract } from '../dynamicFields/dynamicValues.apicontract';
import { EventResponse } from '../events/events.apicontract';
import { CitizenAuthenticationType } from '../../models/citizenAuthenticationType';

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

/**
 * To create a booking in BSG, we have a two API workflow where frontend will call an API to make an on hold booking, followed by a second API that contains more citizen details such as UNIFIN to confirm the booking
 * The following API contract is the common variables between the two APIs.
 */
// These fields are common fields shared across
export class BookingOnHoldDetailsRequest {
	public citizenUinFin?: string | null;
	public citizenSalutation?: Salutations | null;
	public citizenName?: string;
	public citizenEmail?: string;
	public citizenPhone?: string | null;
	public dynamicValuesUpdated?: boolean;
	public dynamicValues?: PersistDynamicValueContract[];
	// default validation type: citizen
	public validationType?: BookingValidationType | null;
	public workflowType?: BookingWorkflowType | null;
}

/**
 * The variables in the following API contract are set by the agency, and hence should not be modifiable by the citizens
 * This API contract should not be used in validateOnHold API
 */
export class BookingDetailsRequest extends BookingOnHoldDetailsRequest {
	/**
	 * An external reference Id for this booking (e.g. external Client Id or booking Id).
	 */
	public refId?: string | null;
	public location?: string | null;
	public description?: string | null;
	public videoConferenceUrl?: string | null;
}

export class BookingRequestBase extends BookingDetailsRequest {
	public startDateTime: Date;
	public endDateTime: Date;
	public captchaToken?: string | null;
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

export class ValidateOnHoldRequest extends BookingOnHoldDetailsRequest {
	public citizenUinFinUpdated?: boolean = true; // for backwards compatibility
}

export class SendBookingsToLifeSGRequest {
	serviceId: number;
}

export class BookingResponseBase {
	/**
	 * @isInt
	 */
	public status: number;
	public createdDateTime: Date;
	public serviceName: string;
	public citizenUinFin?: string;
	public citizenSalutation?: Salutations;
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

	/**
	 * (optional) Retrieves the booking UUID, only when creating or rescheduling a booking.
	 */
	public uuid?: string;
	public event?: EventResponse;
	public citizenAuthType?: CitizenAuthenticationType;
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
	public startDateTime: Date;
	public endDateTime: Date;
	public serviceProviderName?: string;
	public serviceProviderEmail?: string;
	public serviceProviderPhone?: string;
	public serviceProviderAgencyUserId?: string;
}

export class BookingResponseV2 extends BookingResponseBase {
	public id: string;
	public serviceId: string;
	public serviceProviderId?: string;
	public startDateTime: Date;
	public endDateTime: Date;
	public serviceProviderName?: string;
	public serviceProviderEmail?: string;
	public serviceProviderPhone?: string;
	public serviceProviderAgencyUserId?: string;
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
	public eventIds?: number[];
	public byPassAuth?: boolean;
	public bookingToken?: string;
}

export class BookingProviderResponseV1 {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;
}

export class BookedSlotResponse {
	public startDateTime: Date;
	public endDateTime: Date;
	public serviceProviderId: string;
}

export class EventBookingRequest extends BookingDetailsRequest {
	public captchaToken?: string | null;
	// default validation type: citizen
	public validationType?: BookingValidationType | null;
	public citizenUinFinUpdated?: boolean;
}
export class EventBookingResponse extends BookingResponseBase {
	public eventId: string;
	public bookingId: string;
	public bookedSlots?: BookedSlotResponse[];
}
export class BookingProviderResponseV2 {
	public id: string;
	public name: string;
}

export class BookingChangeUser {
	/**
	 * @ignore Value provided in the endpoint path
	 */
	public bookingId: number;
	public bookingUUID: string;
}
