import { UserTypeResponse } from '../users/users.apicontract';

export class BookingChangeLogResponse {
	/**
	 * @isInt
	 */
	public bookingId: number;
	public changeLogs: ChangeLogEntryResponse[];
}

export class ChangeLogEntryResponse {
	public timestamp: Date;
	public user: UserTypeResponse;
	public action: ChangeLogActionContract;
	public previousBooking: BookingStateResponse;
	public changes: BookingStateResponse;
}

export type BookingStateResponse = {
	/**
	 * @isInt
	 */
	id?: number;
	/**
	 * @isInt
	 */
	status?: number;
	startDateTime?: Date;
	endDateTime?: Date;
	/**
	 * @isInt
	 */
	serviceId?: number;
	serviceName?: string;
	/**
	 * @isInt
	 */
	serviceProviderId?: number;
	serviceProviderAgencyUserId?: string;
	serviceProviderName?: string;
	serviceProviderEmail?: string;
	serviceProviderPhone?: string;
	citizenUinFin?: string;
	citizenName?: string;
	citizenEmail?: string;
	citizenPhone?: string;
	location?: string;
	description?: string;
};

export type ChangeLogSearchRequest = {};

export enum ChangeLogActionContract {
	Create = 'create',
	Accept = 'accept',
	Reject = 'reject',
	Cancel = 'cancel',
	Update = 'update',
	Reschedule = 'reschedule',
}
