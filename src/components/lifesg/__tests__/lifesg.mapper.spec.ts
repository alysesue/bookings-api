import { LocalDate, LocalDateTime, LocalTime } from '@js-joda/core';
import { AppointmentAgency } from 'mol-lib-api-contract/appointment';
import { CancelAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/cancel-appointment/api-domain';
import { CreateAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/create-appointment/api-domain';
import { DeleteAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/delete-appointment/api-domain';
import { BookingType } from '../../../models/bookingType';
import { Service } from '../../../models';
import { BookingBuilder } from '../../../models/entities/booking';
import { ExternalAgencyAppointmentJobAction } from '../lifesg.apicontract';
import { LifeSGMapper, CreateAppointmentRequestApiDomainWithIsCancelled } from '../lifesg.mapper';

describe('Test lifesg mq observer', () => {
	it('Should map booking object to valid create appointment object when booking is created', async () => {
		const bookingMock = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.withVideoConferenceUrl('https://www.google.com')
			.withRefId('REFID')
			.build();
		bookingMock.id = 1;
		bookingMock.service = new Service();
		bookingMock.service.name = 'service name';
		const bookingType = BookingType.Created;
		const mappedLifeSGAppt = LifeSGMapper.mapLifeSGAppointment(
			bookingMock,
			bookingType,
			ExternalAgencyAppointmentJobAction.CREATE,
		);

		expect(mappedLifeSGAppt).toBeInstanceOf(CreateAppointmentRequestApiDomainWithIsCancelled);
		if (mappedLifeSGAppt instanceof CreateAppointmentRequestApiDomain) {
			const expectedMappedAppt = new CreateAppointmentRequestApiDomain({
				agency: AppointmentAgency.HDB,
				agencyTransactionId: bookingMock.id.toString(),
				uinfin: bookingMock.citizenUinFin,
				date: LocalDate.of(
					bookingMock.startDateTime.getFullYear(),
					bookingMock.startDateTime.getMonth() + 1,
					bookingMock.startDateTime.getDate(),
				),
				startTime: LocalTime.of(bookingMock.startDateTime.getHours(), bookingMock.startDateTime.getMinutes()),
				endTime: LocalTime.of(bookingMock.endDateTime.getHours(), bookingMock.endDateTime.getMinutes()),
				title: bookingMock.service.name,
				hideAgencyContactInfo: false,
				isConfidential: true,
				isVirtual: true,
				virtualAppointmentUrl: bookingMock.videoConferenceUrl,
				agencyLastUpdatedAt: LocalDateTime.now(),
			});
			expect(mappedLifeSGAppt.agency).toEqual(expectedMappedAppt.agency);
			expect(mappedLifeSGAppt.agencyTransactionId).toEqual(expectedMappedAppt.agencyTransactionId);
			expect(mappedLifeSGAppt.uinfin).toEqual(expectedMappedAppt.uinfin);
			expect(mappedLifeSGAppt.date).toEqual(expectedMappedAppt.date);
			expect(mappedLifeSGAppt.startTime).toEqual(expectedMappedAppt.startTime);
			expect(mappedLifeSGAppt.endTime).toEqual(expectedMappedAppt.endTime);
			expect(mappedLifeSGAppt.title).toEqual(expectedMappedAppt.title);
			expect(mappedLifeSGAppt.venueName).toEqual(expectedMappedAppt.venueName);
			expect(mappedLifeSGAppt.venueDescription).toEqual(expectedMappedAppt.venueDescription);
			expect(mappedLifeSGAppt.contactNumber).toEqual(expectedMappedAppt.contactNumber);
			expect(mappedLifeSGAppt.email).toEqual(expectedMappedAppt.email);
			expect(mappedLifeSGAppt.hideAgencyContactInfo).toEqual(expectedMappedAppt.hideAgencyContactInfo);
			expect(mappedLifeSGAppt.isConfidential).toEqual(expectedMappedAppt.isConfidential);
			expect(mappedLifeSGAppt.isVirtual).toEqual(expectedMappedAppt.isVirtual);
		}
	});

	it('Should map booking object to valid create appointment object when a booking has been updated', async () => {
		const bookingMock = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.withVideoConferenceUrl('https://www.google.com')
			.withRefId('REFID')
			.build();
		bookingMock.id = 1;
		bookingMock.service = new Service();
		bookingMock.service.name = 'service name';
		const bookingType = BookingType.CancelledOrRejected;
		const mappedLifeSGAppt = LifeSGMapper.mapLifeSGAppointment(
			bookingMock,
			bookingType,
			ExternalAgencyAppointmentJobAction.UPDATE,
		);
		expect(mappedLifeSGAppt).toBeInstanceOf(CreateAppointmentRequestApiDomain);
		if (mappedLifeSGAppt instanceof CreateAppointmentRequestApiDomain) {
			const expectedMappedAppt = new CreateAppointmentRequestApiDomain({
				agency: AppointmentAgency.HDB,
				agencyTransactionId: bookingMock.id.toString(),
				uinfin: bookingMock.citizenUinFin,
				date: LocalDate.of(
					bookingMock.startDateTime.getFullYear(),
					bookingMock.startDateTime.getMonth() + 1,
					bookingMock.startDateTime.getDate(),
				),
				startTime: LocalTime.of(bookingMock.startDateTime.getHours(), bookingMock.startDateTime.getMinutes()),
				endTime: LocalTime.of(bookingMock.endDateTime.getHours(), bookingMock.endDateTime.getMinutes()),
				title: bookingMock.service.name,
				venueName: bookingMock.location,
				venueDescription: bookingMock.description,
				hideAgencyContactInfo: false,
				isConfidential: true,
				isVirtual: true,
				virtualAppointmentUrl: bookingMock.videoConferenceUrl,
				agencyLastUpdatedAt: LocalDateTime.now(),
			});
			expect(mappedLifeSGAppt.date).toEqual(expectedMappedAppt.date);
			expect(mappedLifeSGAppt.startTime).toEqual(expectedMappedAppt.startTime);
			expect(mappedLifeSGAppt.endTime).toEqual(expectedMappedAppt.endTime);
		}
	});

	xit('Should map booking object to valid cancel appointment object when a booking has been canceled', async () => {
		const bookingMock = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.withVideoConferenceUrl('https://www.google.com')
			.withRefId('REFID')
			.build();
		bookingMock.id = 1;
		bookingMock.service = new Service();
		bookingMock.service.name = 'service name';
		const bookingType = BookingType.CancelledOrRejected;
		const mappedCanceledBooking = LifeSGMapper.mapLifeSGAppointment(
			bookingMock,
			bookingType,
			ExternalAgencyAppointmentJobAction.CANCEL,
		);
		expect(mappedCanceledBooking).toBeInstanceOf(CancelAppointmentRequestApiDomain);
		if (mappedCanceledBooking instanceof CancelAppointmentRequestApiDomain) {
			const expectedMappedAppt = new CancelAppointmentRequestApiDomain({
				agency: AppointmentAgency.HDB,
				agencyTransactionId: bookingMock.id.toString(),
				uinfin: bookingMock.citizenUinFin,
				agencyLastUpdatedAt: LocalDateTime.now(),
			});
			expect(mappedCanceledBooking.agency).toEqual(expectedMappedAppt.agency);
			expect(mappedCanceledBooking.agencyTransactionId).toEqual(expectedMappedAppt.agencyTransactionId);
			expect(mappedCanceledBooking.uinfin).toEqual(expectedMappedAppt.uinfin);
		}
	});

	it('Should map booking object to valid delete appointment object when a booking has been deleted', async () => {
		const bookingMock = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.withVideoConferenceUrl('https://www.google.com')
			.withRefId('REFID')
			.build();
		bookingMock.id = 1;
		bookingMock.service = new Service();
		bookingMock.service.name = 'service name';
		const bookingType = BookingType.CancelledOrRejected;
		const mappedDeletedBooking = LifeSGMapper.mapLifeSGAppointment(
			bookingMock,
			bookingType,
			ExternalAgencyAppointmentJobAction.DELETE,
		);
		expect(mappedDeletedBooking).toBeInstanceOf(DeleteAppointmentRequestApiDomain);
		if (mappedDeletedBooking instanceof DeleteAppointmentRequestApiDomain) {
			const expectedMappedAppt = new DeleteAppointmentRequestApiDomain({
				agency: AppointmentAgency.HDB,
				agencyTransactionId: bookingMock.id.toString(),
				uinfin: bookingMock.citizenUinFin,
			});
			expect(mappedDeletedBooking.agency).toEqual(expectedMappedAppt.agency);
			expect(mappedDeletedBooking.agencyTransactionId).toEqual(expectedMappedAppt.agencyTransactionId);
			expect(mappedDeletedBooking.uinfin).toEqual(expectedMappedAppt.uinfin);
		}
	});
});
