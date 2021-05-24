import { LocalDate, LocalDateTime, LocalTime } from '@js-joda/core';
import { AppointmentAgency } from 'mol-lib-api-contract/appointment';
import { CancelAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/cancel-appointment/api-domain';
import { CreateAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/create-appointment/api-domain';
import { DeleteAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/delete-appointment/api-domain';
import { Booking } from '../../models';
import { ExternalAgencyAppointmentJobAction } from './lifesg.apicontract';

export class LifeSGMapper {
	public static mapLifeSGAppointment(
		booking: Booking,
		action: ExternalAgencyAppointmentJobAction,
	): CreateAppointmentRequestApiDomain | CancelAppointmentRequestApiDomain | DeleteAppointmentRequestApiDomain {
		switch (action) {
			case ExternalAgencyAppointmentJobAction.CREATE:
			case ExternalAgencyAppointmentJobAction.UPDATE:
				return new CreateAppointmentRequestApiDomain({
					agency: AppointmentAgency.HPB,
					agencyTransactionId: booking.id.toString(),
					uinfin: booking.citizenUinFin,
					date: LocalDate.of(
						booking.startDateTime.getFullYear(),
						booking.startDateTime.getMonth(),
						booking.startDateTime.getDate(),
					),
					startTime: LocalTime.of(booking.startDateTime.getHours(), booking.startDateTime.getMinutes()),
					endTime: LocalTime.of(booking.endDateTime.getHours(), booking.endDateTime.getMinutes()),
					title: booking.service.name,
					venueName: booking.location,
					venueDescription: booking.description,
					address: '',
					postalCode: '',
					importantNotes: '',
					contactNumber: booking.citizenPhone,
					email: booking.citizenEmail,
					contactUrl: '',
					hideAgencyContactInfo: false,
					isConfidential: true,
					isVirtual: false,
					virtualAppointmentUrl: booking.videoConferenceUrl,
					agencyLastUpdatedAt: LocalDateTime.now(),
				});
			case ExternalAgencyAppointmentJobAction.CANCEL:
				return new CancelAppointmentRequestApiDomain({
					agency: AppointmentAgency.HPB,
					agencyTransactionId: booking.id.toString(),
					uinfin: booking.citizenUinFin,
					agencyLastUpdatedAt: LocalDateTime.now(),
				});
			case ExternalAgencyAppointmentJobAction.DELETE:
				return new DeleteAppointmentRequestApiDomain({
					agency: AppointmentAgency.HPB,
					agencyTransactionId: booking.id.toString(),
					uinfin: booking.citizenUinFin,
				});
		}
	}
}
