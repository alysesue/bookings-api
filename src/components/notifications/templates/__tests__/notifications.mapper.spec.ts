import { Booking, Organisation, Service, ServiceProvider } from '../../../../models';
import { emailMapper } from '../../notifications.mapper';

describe('Notification mapper tests', () => {
	const booking = new Booking();
	booking.startDateTime = new Date(2021, 3, 14, 10);
	booking.endDateTime = new Date(2021, 3, 14, 11);
	booking.service = { name: 'Career' } as Service;
	booking.status = 1;
	booking.location = 'Some street';
	booking.serviceProviderId = 1;
	booking.serviceProvider = { name: 'armin' } as ServiceProvider;
	booking.videoConferenceUrl = 'http://www.zoom.us/1234567';

	it('all fields should be defined', () => {
		const {
			serviceName,
			spNameDisplayedForCitizen,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(booking);
		expect(day).toEqual(`14 April 2021`);
		expect(time).toEqual(`10:00am - 11:00am`);
		expect(status).toEqual(`Pending Approval`);
		expect(serviceName).toEqual(`Career`);
		expect(spNameDisplayedForCitizen).toEqual(` - armin`);
		expect(locationText).toEqual(`Location: <b>Some street</b>`);
		expect(videoConferenceUrl).toEqual(
			`Video Conference Link: <a href='http://www.zoom.us/1234567'>http://www.zoom.us/1234567</a>`,
		);
	});

	it('booking service name should be empty', () => {
		booking.service = undefined;

		const { serviceName } = emailMapper(booking);
		expect(serviceName).toEqual(``);
	});

	it('booking service provider text should be empty', () => {
		booking.serviceProvider = {} as ServiceProvider;

		const { spNameDisplayedForCitizen } = emailMapper(booking);
		expect(spNameDisplayedForCitizen).toEqual(``);
	});

	it('booking location text should be empty', () => {
		booking.location = ``;

		const { locationText } = emailMapper(booking);
		expect(locationText).toEqual(``);
	});

	it('booking video conference link should be empty', () => {
		booking.videoConferenceUrl = ``;
		booking.service = Service.create('test', new Organisation());

		const { videoConferenceUrl } = emailMapper(booking);
		expect(videoConferenceUrl).toEqual(``);
	});

	it('should map alias name', () => {
		booking.serviceProvider.name = 'armin';
		booking.serviceProvider.aliasName = 'Orange';
		const { spNameDisplayedForCitizen, spNameDisplayedForServiceProvider } = emailMapper(booking);
		expect(spNameDisplayedForServiceProvider).toEqual(` - armin`);
		expect(spNameDisplayedForCitizen).toEqual(` - Orange`);
	});
});
