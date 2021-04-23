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
	booking.startDateTime = new Date('2021-04-14T02:00:00.000Z');
	booking.endDateTime = new Date('2021-04-14T03:00:00.000Z');
	booking.service = { name: 'Career' } as Service;
	booking.status = 1;
	booking.location = 'Some street';
	booking.serviceProviderId = 1;

	it('should create citizen email for citizen created booking', () => {
		const result = new CitizenEmailTemplateBookingActionByCitizen().CreatedBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for citizen updated booking', () => {
		const result = new CitizenEmailTemplateBookingActionByCitizen().UpdatedBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for citizen cancelled booking', () => {
		const result = new CitizenEmailTemplateBookingActionByCitizen().CancelledBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for service provider created booking', () => {
		const result = new CitizenEmailTemplateBookingActionByServiceProvider().CreatedBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for service provider updated booking', () => {
		const result = new CitizenEmailTemplateBookingActionByServiceProvider().UpdatedBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for service provider cancelled booking', () => {
		const result = new CitizenEmailTemplateBookingActionByServiceProvider().CancelledBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for citizen created booking', () => {
		const result = new ServiceProviderEmailTemplateBookingActionByCitizen().CreatedBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for citizen updated booking', () => {
		const result = new ServiceProviderEmailTemplateBookingActionByCitizen().UpdatedBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for citizen cancelled booking', () => {
		const result = new ServiceProviderEmailTemplateBookingActionByCitizen().CancelledBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for service provider updated booking', () => {
		const result = new ServiceProviderEmailTemplateBookingActionByServiceProvider().UpdatedBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for service provider cancelled booking', () => {
		const result = new ServiceProviderEmailTemplateBookingActionByServiceProvider().CancelledBookingEmail(booking);
		expect(result).toMatchSnapshot();
	});
});
