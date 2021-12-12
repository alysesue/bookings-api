import { Booking, Organisation, Service, ServiceProvider, Event, OneOffTimeslot } from '../../../models';
import { emailMapper, eventEmailMapper, mapVariablesValuesToTemplate } from '../notifications.mapper';
import { getConfig } from '../../../config/app-config';
import { EmailNotificationTemplateType, EmailRecipient } from '../notifications.enum';
import { IServiceProvider } from '../../../models/interfaces';
import { DateHelper } from '../../../infrastructure/dateHelper';

import { CitizenAuthenticationType } from '../../../models/citizenAuthenticationType';

jest.mock('../../../config/app-config', () => ({
	getConfig: jest.fn(),
}));

describe('Notification mapper tests', () => {
	const booking = new Booking();
	beforeEach(() => {
		booking.startDateTime = new Date(2021, 3, 14, 10);
		booking.endDateTime = new Date(2021, 3, 14, 11);
		booking.service = Service.create('Career', new Organisation());
		booking.status = 1;
		booking.location = 'Some street';
		booking.serviceProviderId = 1;
		booking.serviceProvider = { name: 'armin' } as ServiceProvider;
		booking.videoConferenceUrl = 'http://www.zoom.us/1234567';
		booking.uuid = 'f4533bed-da08-473a-8641-7aef918fe0db';
		booking.citizenAuthType = CitizenAuthenticationType.Singpass;
		(getConfig as jest.Mock).mockReturnValue({
			appURL: 'http://www.local.booking.gov.sg:3000',
		});
	});

	it('all fields should be defined', () => {
		const {
			serviceName,
			spNameDisplayedForCitizen,
			status,
			day,
			time,
			location,
			videoConferenceUrl,
			manageBookingLink,
		} = emailMapper(booking, false, 'http://www.local.booking.gov.sg:3000');
		expect(day).toEqual(`14 April 2021`);
		expect(time).toEqual(`10:00am - 11:00am`);
		expect(status).toEqual(`Pending Approval`);
		expect(serviceName).toEqual(`Career`);
		expect(spNameDisplayedForCitizen).toEqual(` - armin`);
		expect(location).toEqual(`Location: <b>Some street</b>`);
		expect(videoConferenceUrl).toEqual(
			`Video Conference Link: <a href='http://www.zoom.us/1234567'>http://www.zoom.us/1234567</a>`,
		);
		expect(manageBookingLink).toEqual(
			`<a href='http://www.local.booking.gov.sg:3000/public/my-bookings/?bookingToken=f4533bed-da08-473a-8641-7aef918fe0db&authType=singpass'>Reschedule / Cancel Booking</a>`,
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

		const { location } = emailMapper(booking);
		expect(location).toEqual(``);
	});

	it('booking video conference link should be empty', () => {
		booking.videoConferenceUrl = ``;

		const { videoConferenceUrl } = emailMapper(booking);
		expect(videoConferenceUrl).toEqual(``);
	});

	it('should use the service vc link as videoConferenceUrl when booking vc link is empty', () => {
		booking.service.videoConferenceUrl = 'http://www.zoom.us/ThisIsServiceVcLink';
		booking.videoConferenceUrl = ``;

		const { videoConferenceUrl } = emailMapper(booking);
		expect(videoConferenceUrl).toEqual(
			`Video Conference Link: <a href='http://www.zoom.us/ThisIsServiceVcLink'>http://www.zoom.us/ThisIsServiceVcLink</a>`,
		);
	});

	it('should map alias name', () => {
		booking.serviceProvider.aliasName = 'Orange';
		const { spNameDisplayedForCitizen, spNameDisplayedForServiceProvider } = emailMapper(booking);
		expect(spNameDisplayedForServiceProvider).toEqual(` - armin`);
		expect(spNameDisplayedForCitizen).toEqual(` - Orange`);
	});

	it('should map variables values to service template - otp user', () => {
		booking.serviceProvider.aliasName = 'Orange';
		booking.reasonToReject = 'rejected';
		booking.citizenAuthType = CitizenAuthenticationType.Otp;
		const template =
			'status: {status}\n' +
			'serviceName: {serviceName}\n' +
			'serviceProviderName: {serviceProviderName}\n' +
			'serviceProviderAliasName: {serviceProviderAliasName}\n' +
			'{location}\n' +
			'day: {day}\n' +
			'time: {time}\n' +
			'videoConferenceUrl: {videoConferenceUrl}\n' +
			'reasonToReject: {reasonToReject}\n' +
			'manageBookingLink: {manageBookingLink}';

		const expectedReturnedTemplate =
			'status: Pending Approval\n' +
			'serviceName: Career\n' +
			'serviceProviderName: armin\n' +
			'serviceProviderAliasName: Orange\n' +
			'Location: <b>Some street</b>\n' +
			'day: 14 April 2021\n' +
			'time: 10:00am - 11:00am\n' +
			"videoConferenceUrl: Video Conference Link: <a href='http://www.zoom.us/1234567'>http://www.zoom.us/1234567</a>\n" +
			'reasonToReject: <br/>Reason: rejected.\n' +
			"manageBookingLink: <a href='http://www.local.booking.gov.sg:3000/public/my-bookings/?bookingToken=f4533bed-da08-473a-8641-7aef918fe0db&authType=otp'>Reschedule / Cancel Booking</a>";

		const returnedTemplate = mapVariablesValuesToTemplate(
			emailMapper(booking, false, getConfig().appURL),
			template,
			EmailRecipient.Citizen,
		);
		expect(returnedTemplate).toEqual(expectedReturnedTemplate);
	});

	it('should map variables values to service template - singpass user', () => {
		booking.serviceProvider.aliasName = 'Orange';
		booking.reasonToReject = 'rejected';
		booking.citizenAuthType = CitizenAuthenticationType.Singpass;
		const template =
			'status: {status}\n' +
			'serviceName: {serviceName}\n' +
			'serviceProviderName: {serviceProviderName}\n' +
			'serviceProviderAliasName: {serviceProviderAliasName}\n' +
			'{location}\n' +
			'day: {day}\n' +
			'time: {time}\n' +
			'videoConferenceUrl: {videoConferenceUrl}\n' +
			'reasonToReject: {reasonToReject}\n' +
			'manageBookingLink: {manageBookingLink}';

		const expectedReturnedTemplate =
			'status: Pending Approval\n' +
			'serviceName: Career\n' +
			'serviceProviderName: armin\n' +
			'serviceProviderAliasName: Orange\n' +
			'Location: <b>Some street</b>\n' +
			'day: 14 April 2021\n' +
			'time: 10:00am - 11:00am\n' +
			"videoConferenceUrl: Video Conference Link: <a href='http://www.zoom.us/1234567'>http://www.zoom.us/1234567</a>\n" +
			'reasonToReject: <br/>Reason: rejected.\n' +
			"manageBookingLink: <a href='http://www.local.booking.gov.sg:3000/public/my-bookings/?bookingToken=f4533bed-da08-473a-8641-7aef918fe0db&authType=singpass'>Reschedule / Cancel Booking</a>";

		const returnedTemplate = mapVariablesValuesToTemplate(
			emailMapper(booking, false, getConfig().appURL),
			template,
			EmailRecipient.Citizen,
		);
		expect(returnedTemplate).toEqual(expectedReturnedTemplate);
	});

	it('should map variables values to service template for event', () => {
		booking.event = new Event();
		booking.event.title = 'event title';
		const oneOffTimeslots = new OneOffTimeslot();
		oneOffTimeslots.startDateTime = new Date(2021, 3, 14, 10);
		oneOffTimeslots.endDateTime = new Date(2021, 3, 14, 11);
		oneOffTimeslots.serviceProvider = { name: 'John Doe' } as IServiceProvider;
		const oneOffTimeslots2 = new OneOffTimeslot();
		oneOffTimeslots2.startDateTime = new Date(2021, 3, 14, 10);
		oneOffTimeslots2.endDateTime = new Date(2021, 3, 14, 11);
		oneOffTimeslots2.serviceProvider = { name: 'Jane Doe' } as IServiceProvider;
		booking.event.oneOffTimeslots = [oneOffTimeslots, oneOffTimeslots2];
		booking.citizenAuthType = CitizenAuthenticationType.Singpass;

		const dateAndTime = `${DateHelper.getDateFormat(
			new Date(2021, 3, 14, 10),
		)}, ${DateHelper.getTime12hFormatString(new Date(2021, 3, 14, 10))} - ${DateHelper.getTime12hFormatString(
			new Date(2021, 3, 14, 11),
		)} - John Doe<br>${DateHelper.getDateFormat(new Date(2021, 3, 14, 10))}, ${DateHelper.getTime12hFormatString(
			new Date(2021, 3, 14, 10),
		)} - ${DateHelper.getTime12hFormatString(new Date(2021, 3, 14, 11))} - Jane Doe<br>`;

		const template =
			'status: {status}\n' +
			'{location}\n' +
			'Date & times:\n{dateTimeServiceProvider}\n' +
			'manageBookingLink: {manageBookingLink}';

		const expectedReturnedTemplate =
			'status: Pending Approval\n' +
			'Location: <b>Some street</b>\n' +
			'Date & times:\n' +
			`${dateAndTime}\n` +
			"manageBookingLink: <a href='http://www.local.booking.gov.sg:3000/public/my-bookings/?bookingToken=f4533bed-da08-473a-8641-7aef918fe0db&authType=singpass'>Reschedule / Cancel Booking</a>";

		const returnedTemplate = mapVariablesValuesToTemplate(
			eventEmailMapper(
				booking,
				EmailNotificationTemplateType.CreatedByServiceProviderSentToCitizenEvent,
				false,
				getConfig().appURL,
			),
			template,
			EmailRecipient.Citizen,
		);
		expect(returnedTemplate).toEqual(expectedReturnedTemplate);
	});
});
