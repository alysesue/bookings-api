import { emailMapper } from '../notifications.mapper';

export abstract class EmailTemplateBase {
	public subject: string;
	public html: string;
}

export abstract class EmailBookingTemplate {
	public abstract CreatedBookingEmail(data): EmailTemplateBase;
	public abstract UpdatedBookingEmail(data): EmailTemplateBase;
	public abstract CancelledBookingEmail(data): EmailTemplateBase;
}

export class CitizenEmailTemplateBookingActionByCitizen implements EmailBookingTemplate {
	public CreatedBookingEmail(data): EmailTemplateBase {
		const { serviceName, serviceProviderText, status, day, time, locationText, videoConferenceUrl } = emailMapper(
			data,
		);

		return {
			subject: `BookingSG confirmation: ${serviceName}${serviceProviderText}`,
			html: `<pre>
Your booking request has been received.
<br />
Booking for: <b>${serviceName}${serviceProviderText}.</b>
<br />
Below is a confirmation of your booking details.
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
${videoConferenceUrl}
${locationText}
</pre>`,
		};
	}

	public UpdatedBookingEmail(data): EmailTemplateBase {
		const { serviceName, serviceProviderText, status, day, time, locationText, videoConferenceUrl } = emailMapper(
			data,
		);

		return {
			subject: `BookingSG update: ${serviceName}${serviceProviderText}`,
			html: `<pre>
You have updated a booking.
<br />
Booking for: <b>${serviceName}${serviceProviderText}.</b>
<br />
Below is a confirmation of your updated booking details.
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
${videoConferenceUrl}
${locationText}
</pre>`,
		};
	}

	public CancelledBookingEmail(data): EmailTemplateBase {
		const { serviceName, serviceProviderText, status, day, time, locationText, videoConferenceUrl } = emailMapper(
			data,
		);

		return {
			subject: `BookingSG cancellation: ${serviceName}${serviceProviderText}`,
			html: `<pre>
You have cancelled the following booking.
<br />
Booking for: <b>${serviceName}${serviceProviderText}.</b>
<br />
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
${videoConferenceUrl}
${locationText}
</pre>`,
		};
	}
}

export class CitizenEmailTemplateBookingActionByServiceProvider implements EmailBookingTemplate {
	public CreatedBookingEmail(data): EmailTemplateBase {
		const { serviceName, serviceProviderText, status, day, time, locationText, videoConferenceUrl } = emailMapper(
			data,
		);

		return {
			subject: `BookingSG confirmation: ${serviceName}${serviceProviderText}`,
			html: `<pre>
A booking has been made.
<br />
Booking for: <b>${serviceName}${serviceProviderText}.</b>
<br />
Below is a confirmation of your booking details.
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
${videoConferenceUrl}
${locationText}
</pre>`,
		};
	}

	public UpdatedBookingEmail(data): EmailTemplateBase {
		const { serviceName, serviceProviderText, status, day, time, locationText, videoConferenceUrl } = emailMapper(
			data,
		);

		return {
			subject: `BookingSG update: ${serviceName}${serviceProviderText}`,
			html: `<pre>
There has been an update to your booking confirmation.
<br />
Booking for: <b>${serviceName}${serviceProviderText}.</b>
<br />
Below is a confirmation of your updated booking details.
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
${videoConferenceUrl}
${locationText}
</pre>`,
		};
	}

	public CancelledBookingEmail(data): EmailTemplateBase {
		const {
			serviceName,
			serviceProviderText,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
			reasonToReject,
		} = emailMapper(data);

		return {
			subject: `BookingSG cancellation: ${serviceName}${serviceProviderText}`,
			html: `<pre>
The following booking has been cancelled by the other party.
${reasonToReject}
<br />
Booking for: <b>${serviceName}${serviceProviderText}.</b>
<br />
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
${videoConferenceUrl}
${locationText}
</pre>`,
		};
	}
}
