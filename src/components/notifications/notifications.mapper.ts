import { Booking } from '../../models';
import { DateHelper } from '../../infrastructure/dateHelper';
import { BookingStatusDisplayedInEmails } from '../../models/bookingStatus';
import { EmailNotificationTemplateType, EmailRecipient } from './notifications.enum';
import { defaultTemplates } from './templates/defaultNotificationTemplate';

export class EmailData {
	status: string;
	serviceName: string;
	serviceProviderName: string;
	spNameDisplayedForServiceProvider: string;
	spNameDisplayedForCitizen: string;
	location: string;
	day: string;
	time: string;
	dateTimeServiceProvider?: string;
	videoConferenceUrl?: string;
	reasonToReject?: string;
	serviceProviderAliasName?: string;
	manageBookingLink?: string;
	eventUpdateDescription?: string;
	eventName?: string;
	eventSummaryDescription?: string;
}

export interface MailOptions {
	from?: string;
	to: string[];
	cc?: string | string[];
	bcc?: string | string[];
	subject: string;
	text?: string;
	html: string;
}

const commonMapper = (data: Booking, isSMS = false, appURL?: string): Partial<EmailData> => {
	const status = BookingStatusDisplayedInEmails[data.status];
	const serviceName = data.service?.name || '';
	const serviceProviderName = data.serviceProvider?.name;
	const serviceProviderAliasName = data.serviceProvider?.aliasName;
	const spNameDisplayedForCitizen = serviceProviderAliasName
		? ` - ${serviceProviderAliasName}`
		: serviceProviderName
		? ` - ${serviceProviderName}`
		: '';
	const spNameDisplayedForServiceProvider = serviceProviderName ? ` - ${serviceProviderName}` : '';
	const reasonToReject = data.reasonToReject ? `<br/>Reason: ${data.reasonToReject}.` : '';
	let location = data.location ? `Location: <b>${data.location}</b>` : '';

	if (location.length && isSMS) {
		location = `Location: ${data.location}`;
	}

	const manageBookingURL = `${appURL}/public/my-bookings/?bookingToken=${data.uuid}&authType=${data.citizenAuthType}`;
	const manageBookingLink = manageBookingURL ? `<a href='${manageBookingURL}'>Reschedule / Cancel Booking</a>` : '';

	return {
		status,
		serviceName,
		serviceProviderName,
		spNameDisplayedForCitizen,
		spNameDisplayedForServiceProvider,
		location,
		reasonToReject,
		serviceProviderAliasName,
		manageBookingLink,
	};
};

export const emailMapper = (data: Booking, isSMS = false, appURL?: string): Partial<EmailData> => {
	const commonData = commonMapper(data, isSMS, appURL);
	const day = DateHelper.getDateFormat(data.startDateTime);
	const time = `${DateHelper.getTime12hFormatString(data.startDateTime)} - ${DateHelper.getTime12hFormatString(
		data.endDateTime,
	)}`;

	let vcLink: string;
	if (data.videoConferenceUrl) {
		vcLink = data.videoConferenceUrl;
	} else if (data.service.videoConferenceUrl) {
		vcLink = data.service.videoConferenceUrl;
	}
	let videoConferenceUrl = vcLink ? `Video Conference Link: <a href='${vcLink}'>${vcLink}</a>` : '';

	if (videoConferenceUrl && isSMS) {
		videoConferenceUrl = `Video Conference Link:${vcLink}`;
	}

	return {
		...commonData,
		day,
		time,
		videoConferenceUrl,
	};
};

export const eventEmailMapper = (
	data: Booking,
	emailTemplateType: EmailNotificationTemplateType,
	isSMS = false,
	appURL?: string,
): Partial<EmailData> => {
	const commonData = commonMapper(data, isSMS, appURL);
	let dateTimeServiceProvider = '';
	data.event.oneOffTimeslots.map((slot) => {
		dateTimeServiceProvider += `${DateHelper.getDateFormat(
			slot.startDateTime,
		)}, ${DateHelper.getTime12hFormatString(data.startDateTime)} - ${DateHelper.getTime12hFormatString(
			data.endDateTime,
		)} - ${slot.serviceProvider.name}<br>`;
	});

	const eventName = data.event.title;
	const type = EmailNotificationTemplateType[emailTemplateType].toString();
	const eventUpdateDescription = defaultTemplates.eventUpdateDescription[type];
	const eventSummaryDescription = defaultTemplates.eventSummaryDescription[type];
	return {
		...commonData,
		dateTimeServiceProvider,
		eventName,
		eventUpdateDescription,
		eventSummaryDescription,
	};
};

export const mapVariablesValuesToTemplate = (
	mapValues: Partial<EmailData>,
	template: string,
	receipient: EmailRecipient,
): string => {
	const {
		serviceName,
		serviceProviderName,
		serviceProviderAliasName,
		spNameDisplayedForCitizen,
		spNameDisplayedForServiceProvider,
		status,
		day,
		time,
		location,
		videoConferenceUrl,
		reasonToReject,
		manageBookingLink,
		dateTimeServiceProvider,
		eventName,
		eventUpdateDescription,
		eventSummaryDescription,
	} = mapValues;

	const mapVariables = {
		'{serviceName}': serviceName,
		'{serviceProviderName}': serviceProviderName,
		'{serviceProviderAliasName}': serviceProviderAliasName,
		'{spNameDisplayedForCitizen}': spNameDisplayedForCitizen,
		'{spNameDisplayedForServiceProvider}': spNameDisplayedForServiceProvider,
		'{status}': status,
		'{day}': day,
		'{time}': time,
		'{location}': location,
		'{videoConferenceUrl}': videoConferenceUrl,
		'{reasonToReject}': reasonToReject,
		'{manageBookingLink}': receipient === EmailRecipient.Citizen ? manageBookingLink : '',
		'{dateTimeServiceProvider}': dateTimeServiceProvider,
		'{eventName}': eventName,
		'{eventUpdateDescription}': eventUpdateDescription,
		'{eventSummaryDescription}': eventSummaryDescription,
	};

	for (const key of Object.keys(mapVariables)) {
		template = template.replace(new RegExp(key, 'g'), mapVariables[key]);
	}

	return template;
};
