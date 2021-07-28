import { Booking } from '../../models';
import { DateHelper } from '../../infrastructure/dateHelper';
import { BookingStatusDisplayedInEmails } from '../../models/bookingStatus';

export interface EmailData {
	status: string;
	serviceName: string;
	serviceProviderName: string;
	spNameDisplayedForServiceProvider: string;
	spNameDisplayedForCitizen: string;
	location: string;
	locationText: string;
	day: string;
	time: string;
	videoConferenceUrl?: string;
	reasonToReject?: string;
	serviceProviderAliasName?: string;
	manageBookingText?: string;
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

export const emailMapper = (data: Booking, isSMS = false, appURL?: string): EmailData => {
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
	const location = data.location;
	const reasonToReject = data.reasonToReject ? `<br/>Reason: ${data.reasonToReject}.` : '';
	let locationText = location ? `Location: <b>${location}</b>` : '';
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

	if (locationText.length && isSMS) {
		locationText = `Location: ${location}`;
	}
	if (videoConferenceUrl && isSMS) {
		videoConferenceUrl = `Video Conference Link:${vcLink}`;
	}
	const manageBookingURL = `${appURL}/public/my-bookings/?bookingToken=${data.uuid}`;
	const manageBookingText = manageBookingURL ? `<a href='${manageBookingURL}'>Reschedule / Cancel Booking</a>` : '';

	return {
		status,
		serviceName,
		serviceProviderName,
		spNameDisplayedForCitizen,
		spNameDisplayedForServiceProvider,
		location,
		locationText,
		day,
		time,
		videoConferenceUrl,
		reasonToReject,
		serviceProviderAliasName,
		manageBookingText,
	};
};

export const mapVariablesValuesToDefaultTemplate = (mapValues: EmailData, template: string): string => {
	const {
		serviceName,
		spNameDisplayedForCitizen,
		spNameDisplayedForServiceProvider,
		status,
		day,
		time,
		locationText,
		videoConferenceUrl,
		reasonToReject,
		manageBookingText,
	} = mapValues;

	const mapVariables = {
		'{serviceName}': serviceName,
		'{spNameDisplayedForCitizen}': spNameDisplayedForCitizen,
		'{spNameDisplayedForServiceProvider}': spNameDisplayedForServiceProvider,
		'{status}': status,
		'{day}': day,
		'{time}': time,
		'{locationText}': locationText,
		'{videoConferenceUrl}': videoConferenceUrl,
		'{reasonToReject}': reasonToReject,
		'{manageBookingText}': manageBookingText,
	};

	for (const key of Object.keys(mapVariables)) {
		template = template.replace(new RegExp(key, 'g'), mapVariables[key]);
	}

	return template;
};

export const mapVariablesValuesToServiceTemplate = (mapValues: EmailData, template: string): string => {
	const {
		status,
		serviceName,
		serviceProviderName,
		serviceProviderAliasName,
		location,
		day,
		time,
		videoConferenceUrl,
		reasonToReject,
	} = mapValues;

	const mapVariables = {
		'{status}': status,
		'{serviceName}': serviceName,
		'{serviceProviderName}': serviceProviderName,
		'{serviceProviderAliasName}': serviceProviderAliasName,
		'{location}': location,
		'{day}': day,
		'{time}': time,
		'{videoConferenceUrl}': videoConferenceUrl,
		'{reasonToReject}': reasonToReject,
	};

	for (const key of Object.keys(mapVariables)) {
		template = template.replace(new RegExp(key, 'g'), mapVariables[key]);
	}

	return template;
};
