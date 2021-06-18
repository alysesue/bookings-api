import { Booking, Service } from '../../../../models';
import {
	CitizenSMSTemplateBookingActionByCitizen,
	CitizenSMSTemplateBookingActionByServiceProvider,
} from '../citizen.sms';

describe('Notification SMS templates tests', () => {
	const booking = new Booking();
	booking.startDateTime = new Date(2021, 3, 14, 10);
	booking.endDateTime = new Date(2021, 3, 14, 11);
	booking.service = { name: 'Career' } as Service;
	booking.status = 1;
	booking.location = 'Some street';
	booking.serviceProviderId = 1;
	booking.videoConferenceUrl = 'http://www.zoom.us/1234567';

	it('should create citizen sms for citizen created booking', () => {
		const result = new CitizenSMSTemplateBookingActionByCitizen().CreatedBookingSMS(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen sms for citizen updated booking', () => {
		const result = new CitizenSMSTemplateBookingActionByCitizen().UpdatedBookingSMS(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen sms for citizen cancelled booking', () => {
		const result = new CitizenSMSTemplateBookingActionByCitizen().CancelledBookingSMS(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen sms for service provider created booking', () => {
		const result = new CitizenSMSTemplateBookingActionByServiceProvider().CreatedBookingSMS(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen sms for service provider updated booking', () => {
		const result = new CitizenSMSTemplateBookingActionByServiceProvider().UpdatedBookingSMS(booking);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen sms for service provider cancelled booking', () => {
		const result = new CitizenSMSTemplateBookingActionByServiceProvider().CancelledBookingSMS(booking);
		expect(result).toMatchSnapshot();
	});
});
