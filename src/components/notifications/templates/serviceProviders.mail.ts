import { EmailBookingTemplate, EmailTemplateBase } from './citizen.mail';
import { emailMapper } from '../notifications.mapper';

export class ServiceProviderEmailTemplateBookingActionByCitizen implements EmailBookingTemplate {
	public static CreatedBookingEmail(data) {
		const { serviceName, serviceProviderText, status, day, time, locationText } = emailMapper(data);
		return {
			subject: `BookingSG request: ${serviceName}${serviceProviderText}`,
			html: `<pre>
You have received a new booking request.
<br />
Booking for: <b>${serviceName}${serviceProviderText}.</b>
<br />
Below is a summary of the booking request details.
<br/>
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
There has been an update to the following booking by the other party.
<br />
Booking for: <b>${serviceName}${serviceProviderText}.</b>
<br />
Below is a confirmation of the updated booking details.
<br/>
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

export class ServiceProviderEmailTemplateBookingActionByServiceProvider implements EmailBookingTemplate {
	public static UpdatedBookingEmail(data) {
		const { serviceName, serviceProviderText, status, day, time, locationText } = emailMapper(data);
		return {
			subject: `BookingSG update: ${serviceName}${serviceProviderText}`,
			html: `<pre>
You have updated a booking.
<br />
Booking for: <b>${serviceName}${serviceProviderText}.</b>
<br />
Below is a summary of your updated booking details.
<br/>
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
Location: <b>${locationText}</b>
</pre>`,
		};
	}

	public static CancelledBookingEmail(data): EmailTemplateBase {
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
