import { CancelAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/cancel-appointment/api-domain';
import { CreateAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/create-appointment/api-domain';
import { DeleteAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/delete-appointment/api-domain';
import { Service } from '../../../models';
import { BookingBuilder } from '../../../models/entities/booking';
import { ExternalAgencyAppointmentJobAction } from '../lifesg.apicontract';
import { LifeSGMapper } from '../lifesg.mapper';

describe('Test lifesg mq observer', () => {
	it('Should map booking object to valid create appointment object when booking is created', async () => {
		const bookingMock = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.withRefId('REFID')
			.build();
		bookingMock.id = 1;
		bookingMock.service = new Service();
		bookingMock.service.name = 'service name';

		expect(
			LifeSGMapper.mapLifeSGAppointment(bookingMock, ExternalAgencyAppointmentJobAction.CREATE),
		).toBeInstanceOf(CreateAppointmentRequestApiDomain);
	});

	it('Should map booking object to valid create appointment object when a booking has been updated', async () => {
		const bookingMock = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.withRefId('REFID')
			.build();
		bookingMock.id = 1;
		bookingMock.service = new Service();
		bookingMock.service.name = 'service name';

		expect(
			LifeSGMapper.mapLifeSGAppointment(bookingMock, ExternalAgencyAppointmentJobAction.UPDATE),
		).toBeInstanceOf(CreateAppointmentRequestApiDomain);
	});

	it('Should map booking object to valid cancel appointment object when a booking has been canceled', async () => {
		const bookingMock = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.withRefId('REFID')
			.build();
		bookingMock.id = 1;
		bookingMock.service = new Service();
		bookingMock.service.name = 'service name';

		expect(
			LifeSGMapper.mapLifeSGAppointment(bookingMock, ExternalAgencyAppointmentJobAction.CANCEL),
		).toBeInstanceOf(CancelAppointmentRequestApiDomain);
	});

	it('Should map booking object to valid delete appointment object when a booking has been deleted', async () => {
		const bookingMock = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.withRefId('REFID')
			.build();
		bookingMock.id = 1;
		bookingMock.service = new Service();
		bookingMock.service.name = 'service name';

		expect(
			LifeSGMapper.mapLifeSGAppointment(bookingMock, ExternalAgencyAppointmentJobAction.DELETE),
		).toBeInstanceOf(DeleteAppointmentRequestApiDomain);
	});
});
