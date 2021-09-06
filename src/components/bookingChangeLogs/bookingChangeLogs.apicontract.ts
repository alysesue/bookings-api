import { DynamicValueContract } from '../dynamicFields/dynamicValues.apicontract';
import { UserTypeResponse } from '../users/users.apicontract';

export class BookingChangeLogResponseV1 {
	/**
	 * @isInt
	 */
	public bookingId: number;
	public changeLogs: ChangeLogEntryResponseV1[];
}

export class BookingChangeLogResponseV2 {
	public bookingId: string;
	public changeLogs: ChangeLogEntryResponseV2[];
}

export class ChangeLogEntryResponseBase {
	public timestamp: Date;
	public user: UserTypeResponse;
	public action: ChangeLogActionContract;
}

export class ChangeLogEntryResponseV1 extends ChangeLogEntryResponseBase {
	public previousBooking: BookingStateResponseV1;
	public changes: BookingStateResponseV1;
}

export class ChangeLogEntryResponseV2 extends ChangeLogEntryResponseBase {
	public previousBooking: BookingStateResponseV2;
	public changes: BookingStateResponseV2;
}

export class BookingStateResponseBase {
	/**
	 * @isInt
	 */
	public status?: number;
	public startDateTime?: Date;
	public endDateTime?: Date;
	public serviceName?: string;
	public serviceProviderAgencyUserId?: string;
	public serviceProviderName?: string;
	public serviceProviderEmail?: string;
	public serviceProviderPhone?: string;
	public citizenUinFin?: string;
	public citizenName?: string;
	public citizenEmail?: string;
	public citizenPhone?: string;
	public location?: string;
	public description?: string;
	public videoConferenceUrl?: string;
	public refId?: string;
	public dynamicValues?: DynamicValueContract[];
	public serviceProviderAliasName?: string;
}

export class BookingStateResponseV1 extends BookingStateResponseBase {
	/**
	 * @isInt
	 */
	public id?: number;
	/**
	 * @isInt
	 */
	public serviceId?: number;
	/**
	 * @isInt
	 */
	public serviceProviderId?: number;
}

export class BookingStateResponseV2 extends BookingStateResponseBase {
	public id?: string;
	public serviceId?: string;
	public serviceProviderId?: string;
}

export type ChangeLogSearchRequest = {};

export enum ChangeLogActionContract {
	Create = 'create',
	Accept = 'accept',
	Reject = 'reject',
	Cancel = 'cancel',
	Update = 'update',
	Reschedule = 'reschedule',
	UpdateUser = 'update-user',
}
