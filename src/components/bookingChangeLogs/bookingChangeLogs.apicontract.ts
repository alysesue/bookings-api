import { UserTypeResponse } from '../users/users.apicontract';

export class BookingChangeLogResponse {
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
	id?: number;
	status?: number;
	startDateTime?: Date;
	endDateTime?: Date;
	serviceId?: number;
	serviceName?: string;
	serviceProviderId?: number;
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
