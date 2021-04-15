import { emailMapper } from '../notifications.mapper';

export abstract class EmailTemplateBase {
	public subject: string;
	public html: string;
}

export class CitizenEmailTemplateBookingActionByCitizen extends EmailTemplateBase {
	public static CreatedBookingEmail(data) {
		const { serviceName, serviceProviderText, status, day, time, locationText } = emailMapper(data);

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
Location: <b>${locationText}</b>
</pre>`,
		};
	}

	public static UpdatedBookingEmail(data) {
		const { serviceName, serviceProviderText, status, day, time, locationText } = emailMapper(data);
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
Location: <b>${locationText}</b>
</pre>`,
		};
	}

	public static CancelledBookingEmail(data) {
		const { serviceName, serviceProviderText, status, day, time, locationText } = emailMapper(data);
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
Location: <b>${locationText}</b>
</pre>`,
		};
	}
}

export class CitizenEmailTemplateBookingActionByServiceProvider extends EmailTemplateBase {
	public static CreatedBookingEmail(data) {
		const { serviceName, serviceProviderText, status, day, time, locationText } = emailMapper(data);
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
Location: <b>${locationText}</b>
</pre>`,
		};
	}

	public static UpdatedBookingEmail(data) {
		const { serviceName, serviceProviderText, status, day, time, locationText } = emailMapper(data);
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
Location: <b>${locationText}</b>
</pre>`,
		};
	}

	public static CancelledBookingEmail(data) {
		const { serviceName, serviceProviderText, status, day, time, locationText } = emailMapper(data);
		return {
			subject: `BookingSG cancellation: ${serviceName}${serviceProviderText}`,
			html: `<pre>
The following booking has been cancelled by the other party.
<br />
Booking for: <b>${serviceName}${serviceProviderText}.</b>
<br />
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
Location: <b>${locationText}</b>
</pre>`,
		};
	}
}
