import { Booking } from '../../models';
import { DateHelper } from '../../infrastructure/dateHelper';
import { BookingStatusDisplayedInEmails } from '../../models/bookingStatus';

class EmailData {
	public status: string;
	public serviceName: string;
	public serviceProviderName: string;
	public serviceProviderText: string;
	public location: string;
	public locationText: string;
	public day: string;
	public time: string;
	public videoConferenceUrl?: string;
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

export const emailMapper = (data: Booking): EmailData => {
	const status = BookingStatusDisplayedInEmails[data.status];
	const serviceName = data.service?.name || '';
	const serviceProviderName = data.serviceProvider?.name;
	const serviceProviderText = serviceProviderName ? ` - ${serviceProviderName}` : '';
	const location = data.location;
	const locationText = location ? `Location: <b>${location}</b>` : '';
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
	const videoConferenceUrl = vcLink ? `Video Conference Link: <a href='${vcLink}'>${vcLink}</a>` : '';

	return {
		status,
		serviceName,
		serviceProviderName,
		serviceProviderText,
		location,
		locationText,
		day,
		time,
		videoConferenceUrl,
	};
};
