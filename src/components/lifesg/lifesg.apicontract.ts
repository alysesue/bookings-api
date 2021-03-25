import { CancelAppointment, CreateAppointment, DeleteAppointment } from 'mol-lib-api-contract/appointment';

export enum ExternalAgencyAppointmentJobRequestAction {
	CREATE = 'create',
	UPDATE = 'update',
	DELETE = 'delete',
}

export enum ExternalAgencyAppointmentJobAction {
	CREATE = 'create',
	UPDATE = 'update',
	CANCEL = 'cancel',
	DELETE = 'delete',
}

export interface ExternalAgencyAppointmentJobRequest {
	action: ExternalAgencyAppointmentJobRequestAction;
	appointment:
		| CreateAppointment.Domain.CreateAppointmentRequestApiDomain
		| CancelAppointment.Domain.CancelAppointmentRequestApiDomain
		| DeleteAppointment.Domain.DeleteAppointmentRequestApiDomain;
}
