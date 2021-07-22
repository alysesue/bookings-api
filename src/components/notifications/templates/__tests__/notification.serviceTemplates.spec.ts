import {
	CitizenEmailTemplateBookingActionByCitizen,
	CitizenEmailTemplateBookingActionByServiceProvider,
} from '../citizen.mail';
import { Booking, Service, ServiceNotificationTemplate } from '../../../../models';
import { Container } from 'typescript-ioc';
import { ServiceNotificationTemplateService } from '../../../serviceNotificationTemplate/serviceNotificationTemplate.service';
import { ServiceNotificationTemplateServiceMock } from '../../../serviceNotificationTemplate/__mock__/serviceNotificationTemplate.service.mock';
import { EmailNotificationTemplateType } from '../../../../enums/notifications';
import {
	ServiceProviderEmailTemplateBookingActionByCitizen,
	ServiceProviderEmailTemplateBookingActionByServiceProvider,
} from '../serviceProviders.mail';

describe('Services Notification Templates test', () => {
	beforeAll(() => {
		jest.resetAllMocks();
		Container.bind(ServiceNotificationTemplateService).to(ServiceNotificationTemplateServiceMock);
		ServiceNotificationTemplateServiceMock.getNotificationTemplateMock.mockReturnValue(template);
	});

	const template = new ServiceNotificationTemplate();
	template.id = 123;
	template.htmlTemplate =
		'<p>THIS IS A TEST.</p>\n' +
		'<p>Booking for: <strong>{serviceName}</strong>' +
		'<p>Booking status: <strong>{status}</strong>' +
		'<br>Date: <strong>{day}</strong>' +
		'<br>Time: <strong>{time}</strong>' +
		'<br>{videoConferenceUrl}' +
		'<br>{location}&nbsp;</p>';

	const expectedEmail =
		'<p>THIS IS A TEST.</p>\n' +
		'<p>Booking for: <strong>Career</strong>' +
		'<p>Booking status: <strong>Pending Approval</strong>' +
		'<br>Date: <strong>14 April 2021</strong>' +
		'<br>Time: <strong>10:00am - 11:00am</strong>' +
		"<br>Video Conference Link: <a href='http://www.zoom.us/1234567'>http://www.zoom.us/1234567</a>" +
		'<br>Some street&nbsp;</p>';

	const booking = new Booking();
	booking.startDateTime = new Date(2021, 3, 14, 10);
	booking.endDateTime = new Date(2021, 3, 14, 11);
	booking.service = { name: 'Career', id: 1 } as Service;
	booking.status = 1;
	booking.location = 'Some street';
	booking.serviceProviderId = 1;
	booking.videoConferenceUrl = 'http://www.zoom.us/1234567';

	it('should create citizen email with service template for citizen created booking', async () => {
		template.emailTemplateType = EmailNotificationTemplateType.CreatedByCitizenSentToCitizen;
		const email = await Container.get(CitizenEmailTemplateBookingActionByCitizen).CreatedBookingEmail(booking);
		expect(email.html).toEqual(expectedEmail);
	});

	it('should create citizen email with service template for citizen updated booking', async () => {
		template.emailTemplateType = EmailNotificationTemplateType.UpdatedByCitizenSentToCitizen;
		const email = await Container.get(CitizenEmailTemplateBookingActionByCitizen).UpdatedBookingEmail(booking);
		expect(email.html).toEqual(expectedEmail);
	});

	it('should create citizen email with service template for citizen cancelled booking', async () => {
		template.emailTemplateType = EmailNotificationTemplateType.CancelledByCitizenSentToCitizen;
		const email = await Container.get(CitizenEmailTemplateBookingActionByCitizen).CancelledBookingEmail(booking);
		expect(email.html).toEqual(expectedEmail);
	});

	it('should create citizen email with service template for service provider created booking', async () => {
		template.emailTemplateType = EmailNotificationTemplateType.CreatedByServiceProviderSentToCitizen;
		const email = await Container.get(CitizenEmailTemplateBookingActionByServiceProvider).CreatedBookingEmail(
			booking,
		);
		expect(email.html).toEqual(expectedEmail);
	});

	it('should create citizen email with service template for service provider updated booking', async () => {
		template.emailTemplateType = EmailNotificationTemplateType.UpdatedByServiceProviderSentToCitizen;
		const email = await Container.get(CitizenEmailTemplateBookingActionByServiceProvider).UpdatedBookingEmail(
			booking,
		);
		expect(email.html).toEqual(expectedEmail);
	});

	it('should create citizen email with service template for service provider cancelled booking', async () => {
		template.emailTemplateType = EmailNotificationTemplateType.CancelledByServiceProviderSentToCitizen;
		const email = await Container.get(CitizenEmailTemplateBookingActionByServiceProvider).CancelledBookingEmail(
			booking,
		);
		expect(email.html).toEqual(expectedEmail);
	});

	it('should create service provider email with service template for citizen created booking', async () => {
		template.emailTemplateType = EmailNotificationTemplateType.CreatedByCitizenSentToServiceProvider;
		const email = await Container.get(ServiceProviderEmailTemplateBookingActionByCitizen).CreatedBookingEmail(
			booking,
		);
		expect(email.html).toEqual(expectedEmail);
	});

	it('should create service provider email with service template for citizen updated booking', async () => {
		template.emailTemplateType = EmailNotificationTemplateType.UpdatedByCitizenSentToServiceProvider;
		const email = await Container.get(ServiceProviderEmailTemplateBookingActionByCitizen).UpdatedBookingEmail(
			booking,
		);
		expect(email.html).toEqual(expectedEmail);
	});

	it('should create service provider email with service template for citizen cancelled booking', async () => {
		template.emailTemplateType = EmailNotificationTemplateType.CancelledByCitizenSentToServiceProvider;
		const email = await Container.get(ServiceProviderEmailTemplateBookingActionByCitizen).CancelledBookingEmail(
			booking,
		);
		expect(email.html).toEqual(expectedEmail);
	});

	it('should create service provider email with service template for service provider updated booking', async () => {
		template.emailTemplateType = EmailNotificationTemplateType.UpdatedByServiceProviderSentToServiceProvider;
		const email = await Container.get(
			ServiceProviderEmailTemplateBookingActionByServiceProvider,
		).UpdatedBookingEmail(booking);
		expect(email.html).toEqual(expectedEmail);
	});

	it('should create service provider email with service template for service provider cancelled booking', async () => {
		template.emailTemplateType = EmailNotificationTemplateType.CancelledByServiceProviderSentToServiceProvider;
		const email = await Container.get(
			ServiceProviderEmailTemplateBookingActionByServiceProvider,
		).CancelledBookingEmail(booking);
		expect(email.html).toEqual(expectedEmail);
	});
});
