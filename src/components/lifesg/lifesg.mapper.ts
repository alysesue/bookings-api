import { LocalDate, LocalDateTime, LocalTime } from '@js-joda/core';
import { AppointmentAgency } from 'mol-lib-api-contract/appointment';
import { CancelAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/cancel-appointment/api-domain';
import { CreateAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/create-appointment/api-domain';
import { DeleteAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/delete-appointment/api-domain';
import { BookingType } from '../../models/bookingType';
import { Booking } from '../../models';
import { ExternalAgencyAppointmentJobAction } from './lifesg.apicontract';

export class CreateAppointmentRequestApiDomainWithIsCancelled extends CreateAppointmentRequestApiDomain {
	constructor(props: Readonly<CreateAppointmentRequestApiDomainWithIsCancelled>) {
		super(props);
	}
	isCancelled?: boolean;
}

export class LifeSGMapper {
	public static mapLifeSGAppointment(
		booking: Booking,
		bookingType: BookingType,
		action: ExternalAgencyAppointmentJobAction,
	):
		| CreateAppointmentRequestApiDomainWithIsCancelled
		| CancelAppointmentRequestApiDomain
		| DeleteAppointmentRequestApiDomain {
		switch (action) {
			case ExternalAgencyAppointmentJobAction.CREATE:
			case ExternalAgencyAppointmentJobAction.UPDATE:
				return new CreateAppointmentRequestApiDomainWithIsCancelled({
					agency: AppointmentAgency.HPB,
					agencyTransactionId: booking.id.toString(),
					...(action === ExternalAgencyAppointmentJobAction.CREATE && { uinfin: booking.citizenUinFin }),
					date: LocalDate.of(
						booking.startDateTime.getFullYear(),
						booking.startDateTime.getMonth() + 1,
						booking.startDateTime.getDate(),
					),
					startTime: LocalTime.of(booking.startDateTime.getHours(), booking.startDateTime.getMinutes()),
					endTime: LocalTime.of(booking.endDateTime.getHours(), booking.endDateTime.getMinutes()),
					title: booking.service.name,
					hideAgencyContactInfo: false,
					isConfidential: true,
					isVirtual: true,
					virtualAppointmentUrl: booking.videoConferenceUrl,
					agencyLastUpdatedAt: LocalDateTime.now(),
					...(bookingType === BookingType.CancelledOrRejected && { isCancelled: true }),
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
