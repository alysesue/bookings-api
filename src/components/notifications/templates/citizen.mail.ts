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
		const {
			serviceName,
			spNameDisplayedForCitizen,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);

		return {
			subject: `BookingSG confirmation: ${serviceName}${spNameDisplayedForCitizen}`,
			html: `<pre>
Your booking request has been received.
<br />
Booking for: <b>${serviceName}${spNameDisplayedForCitizen}.</b>
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
		const {
			serviceName,
			spNameDisplayedForCitizen,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);

		return {
			subject: `BookingSG update: ${serviceName}${spNameDisplayedForCitizen}`,
			html: `<pre>
You have updated a booking.
<br />
Booking for: <b>${serviceName}${spNameDisplayedForCitizen}.</b>
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
			spNameDisplayedForCitizen,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);

		return {
			subject: `BookingSG cancellation: ${serviceName}${spNameDisplayedForCitizen}`,
			html: `<pre>
You have cancelled the following booking.
<br />
Booking for: <b>${serviceName}${spNameDisplayedForCitizen}.</b>
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
		const {
			serviceName,
			spNameDisplayedForCitizen,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);

		return {
			subject: `BookingSG confirmation: ${serviceName}${spNameDisplayedForCitizen}`,
			html: `<pre>
A booking has been made.
<br />
Booking for: <b>${serviceName}${spNameDisplayedForCitizen}.</b>
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
		const {
			serviceName,
			spNameDisplayedForCitizen,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);

		return {
			subject: `BookingSG update: ${serviceName}${spNameDisplayedForCitizen}`,
			html: `<pre>
There has been an update to your booking confirmation.
<br />
Booking for: <b>${serviceName}${spNameDisplayedForCitizen}.</b>
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
			spNameDisplayedForCitizen,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);

		return {
			subject: `BookingSG cancellation: ${serviceName}${spNameDisplayedForCitizen}`,
			html: `<pre>
The following booking has been cancelled by the other party.
<br />
Booking for: <b>${serviceName}${spNameDisplayedForCitizen}.</b>
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
