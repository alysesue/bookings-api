import {
	CitizenEmailTemplateBookingActionByCitizen,
	CitizenEmailTemplateBookingActionByServiceProvider,
} from '../citizen.mail';
import {
	ServiceProviderEmailTemplateBookingActionByCitizen,
	ServiceProviderEmailTemplateBookingActionByServiceProvider,
} from '../serviceProviders.mail';
import { Booking, Service } from '../../../../models';
import { Container } from 'typescript-ioc';
import { ServiceNotificationTemplateService } from '../../../serviceNotificationTemplate/serviceNotificationTemplate.service';
import { ServiceNotificationTemplateServiceMock } from '../../../serviceNotificationTemplate/__mock__/serviceNotificationTemplate.service.mock';

describe('Notification templates tests', () => {
	beforeAll(() => {
		jest.resetAllMocks();
		Container.bind(ServiceNotificationTemplateService).to(ServiceNotificationTemplateServiceMock);
		ServiceNotificationTemplateServiceMock.getNotificationTemplateMock.mockReturnValue(undefined);
	});

	const booking = new Booking();
	booking.startDateTime = new Date(2021, 3, 14, 10);
	booking.endDateTime = new Date(2021, 3, 14, 11);
	booking.service = { name: 'Career' } as Service;
	booking.status = 1;
	booking.location = 'Some street';
	booking.serviceProviderId = 1;
	booking.videoConferenceUrl = 'http://www.zoom.us/1234567';

	it('should create citizen email for citizen created booking', async () => {
		const result = await Container.get(CitizenEmailTemplateBookingActionByCitizen).CreatedBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for citizen updated booking', async () => {
		const result = await Container.get(CitizenEmailTemplateBookingActionByCitizen).UpdatedBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for citizen cancelled booking', async () => {
		const result = await Container.get(CitizenEmailTemplateBookingActionByCitizen).CancelledBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for service provider created booking', async () => {
		const result = await Container.get(CitizenEmailTemplateBookingActionByServiceProvider).CreatedBookingEmail(
			booking,
		);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for service provider updated booking', async () => {
		const result = await Container.get(CitizenEmailTemplateBookingActionByServiceProvider).UpdatedBookingEmail(
			booking,
		);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for service provider cancelled booking', async () => {
		const result = await Container.get(CitizenEmailTemplateBookingActionByServiceProvider).CancelledBookingEmail(
			booking,
		);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for citizen created booking', async () => {
		const result = await Container.get(ServiceProviderEmailTemplateBookingActionByCitizen).CreatedBookingEmail(
			booking,
		);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for citizen updated booking', async () => {
		const result = await Container.get(ServiceProviderEmailTemplateBookingActionByCitizen).UpdatedBookingEmail(
			booking,
		);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for citizen cancelled booking', async () => {
		const result = await Container.get(ServiceProviderEmailTemplateBookingActionByCitizen).CancelledBookingEmail(
			booking,
		);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for service provider updated booking', async () => {
		const result = await Container.get(
			ServiceProviderEmailTemplateBookingActionByServiceProvider,
		).UpdatedBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for service provider cancelled booking', async () => {
		const result = await Container.get(
			ServiceProviderEmailTemplateBookingActionByServiceProvider,
		).CancelledBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});
});
