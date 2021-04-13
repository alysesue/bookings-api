import {
	CitizenEmailTemplateBookingActionByCitizen,
	CitizenEmailTemplateBookingActionByServiceProvider,
	ServiceProviderEmailTemplateBookingActionByCitizen,
	ServiceProviderEmailTemplateBookingActionByServiceProvider,
} from '../notifications.templates';

describe('Notification templates tests', () => {
	const mockData = {
		_booking: {
			_startDateTime: new Date('2021-04-14T02:00:00.000Z'),
			_endDateTime: new Date('2021-04-14T03:00:00.000Z'),
			_service: { _name: 'Career' },
			_status: 1,
			_location: 'Some street',
			_serviceProviderId: 1,
		},
	};

	it('should create citizen email for citizen created booking', () => {
		const result = CitizenEmailTemplateBookingActionByCitizen.CreatedBookingEmail(mockData);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for citizen updated booking', () => {
		const result = CitizenEmailTemplateBookingActionByCitizen.UpdatedBookingEmail(mockData);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for citizen cancelled booking', () => {
		const result = CitizenEmailTemplateBookingActionByCitizen.CancelledBookingEmail(mockData);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for service provider created booking', () => {
		const result = CitizenEmailTemplateBookingActionByServiceProvider.CreatedBookingEmail(mockData);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for service provider updated booking', () => {
		const result = CitizenEmailTemplateBookingActionByServiceProvider.UpdatedBookingEmail(mockData);
		expect(result).toMatchSnapshot();
	});

	it('should create citizen email for service provider cancelled booking', () => {
		const result = CitizenEmailTemplateBookingActionByServiceProvider.CancelledBookingEmail(mockData);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for citizen created booking', () => {
		const result = ServiceProviderEmailTemplateBookingActionByCitizen.CreatedBookingEmail(mockData);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for citizen updated booking', () => {
		const result = ServiceProviderEmailTemplateBookingActionByCitizen.UpdatedBookingEmail(mockData);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for citizen cancelled booking', () => {
		const result = ServiceProviderEmailTemplateBookingActionByCitizen.CancelledBookingEmail(mockData);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for service provider updated booking', () => {
		const result = ServiceProviderEmailTemplateBookingActionByServiceProvider.UpdatedBookingEmail(mockData);
		expect(result).toMatchSnapshot();
	});

	it('should create service provider email for service provider cancelled booking', () => {
		const result = ServiceProviderEmailTemplateBookingActionByServiceProvider.CancelledBookingEmail(mockData);
		expect(result).toMatchSnapshot();
	});
});
