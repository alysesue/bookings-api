import {
	CitizenEmailTemplateBookingActionByCitizen,
	CitizenEmailTemplateBookingActionByServiceProvider,
} from '../citizen.mail';
import {
	ServiceProviderEmailTemplateBookingActionByCitizen,
	ServiceProviderEmailTemplateBookingActionByServiceProvider,
} from '../serviceProviders.mail';
import { Booking, Service } from '../../../../models';

describe('Notification templates tests', () => {
	const booking = new Booking();
	booking.startDateTime = new Date(2021, 3, 14, 10);
	booking.endDateTime = new Date(2021, 3, 14, 11);
	booking.service = { name: 'Career' } as Service;
	booking.status = 1;
	booking.location = 'Some street';
	booking.serviceProviderId = 1;
	booking.videoConferenceUrl = 'http://www.zoom.us/1234567';

	it('should create citizen email for citizen created booking', async () => {
		const result = await new CitizenEmailTemplateBookingActionByCitizen().CreatedBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for citizen updated booking', async () => {
		const result = await new CitizenEmailTemplateBookingActionByCitizen().UpdatedBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for citizen cancelled booking', async() => {
		const result = await new CitizenEmailTemplateBookingActionByCitizen().CancelledBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for service provider created booking', async() => {
		const result = await new CitizenEmailTemplateBookingActionByServiceProvider().CreatedBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for service provider updated booking', async() => {
		const result = await new CitizenEmailTemplateBookingActionByServiceProvider().UpdatedBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for service provider cancelled booking', async() => {
		const result = await new CitizenEmailTemplateBookingActionByServiceProvider().CancelledBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for citizen created booking', async() => {
		const result = await new ServiceProviderEmailTemplateBookingActionByCitizen().CreatedBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for citizen updated booking', async() => {
		const result = await new ServiceProviderEmailTemplateBookingActionByCitizen().UpdatedBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for citizen cancelled booking', async() => {
		const result = await new ServiceProviderEmailTemplateBookingActionByCitizen().CancelledBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for service provider updated booking', async() => {
		const result = await new ServiceProviderEmailTemplateBookingActionByServiceProvider().UpdatedBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for service provider cancelled booking', async() => {
		const result = await new ServiceProviderEmailTemplateBookingActionByServiceProvider().CancelledBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});
});
