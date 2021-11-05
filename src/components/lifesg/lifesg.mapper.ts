import { LocalDate, LocalDateTime, LocalTime } from '@js-joda/core';
import { AppointmentAgency } from 'mol-lib-api-contract/appointment';
import { CancelAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/cancel-appointment/api-domain';
import { CreateAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/create-appointment/api-domain';
import { DeleteAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/delete-appointment/api-domain';
import { BookingType } from '../../models/bookingType';
import { Booking } from '../../models';
import { ExternalAgencyAppointmentJobAction } from './lifesg.apicontract';

interface CreateAppointmentRequestApiDomainWithIsCancelled extends CreateAppointmentRequestApiDomain {
	isCancelled: boolean;
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
				return {
					...new CreateAppointmentRequestApiDomain({
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
						...(!booking?.videoConferenceUrl && {
							venueName: booking.location ? booking.location : 'mock location',
						}), // TODO: required if isVirtual=true
						...(!booking?.videoConferenceUrl && {
							venueDescription: booking.description ? booking.description : 'mock description',
						}), // TODO: required if isVirtual=true
						...(!booking?.videoConferenceUrl && { address: 'mock address' }), // TODO: required if isVirtual=true
						...(!booking?.videoConferenceUrl && { postalCode: '138577' }), // TODO: required if isVirtual=true
						importantNotes: '',
						...(booking?.citizenPhone && { contactNumber: booking.citizenPhone }), // TODO: lifesg shows as external contact
						...(booking?.citizenEmail && { email: booking.citizenEmail }), // TODO: lifesg shows as external contact
						hideAgencyContactInfo: false,
						isConfidential: true,
						...(booking?.videoConferenceUrl && { isVirtual: true }),
						// no videoConferenceUrl does not mean isVirtual: true, current logic is mocked for required values
						...(booking?.videoConferenceUrl && { virtualAppointmentUrl: booking.videoConferenceUrl }),
						agencyLastUpdatedAt: LocalDateTime.now(),
					}),
					...(bookingType === BookingType.CancelledOrRejected && { isCancelled: true }),
				};
			// TODO: lifesg check for isCancelled when ExternalAgencyAppointmentJobAction is CREATE or UPDATE
			// case ExternalAgencyAppointmentJobAction.CANCEL:
			// 	return new CancelAppointmentRequestApiDomain({
			// 		agency: AppointmentAgency.HPB,
			// 		agencyTransactionId: booking.id.toString(),
			// 		uinfin: booking.citizenUinFin,
			// 		agencyLastUpdatedAt: LocalDateTime.now(),
			// 	});
			case ExternalAgencyAppointmentJobAction.DELETE:
				return new DeleteAppointmentRequestApiDomain({
					agency: AppointmentAgency.HPB,
					agencyTransactionId: booking.id.toString(),
					uinfin: booking.citizenUinFin,
				});
		}
	}
}
