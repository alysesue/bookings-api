import { CreateEmailRequestApiDomain } from 'mol-lib-api-contract/notification/mail/create-email/create-email-api-domain';
import { emailMapper } from './notifications.mapper';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';

export abstract class EmailTemplateBase implements CreateEmailRequestApiDomain {
	public to: string[];
	public subject: string;
	public html: string;
}

export class CitizenEmailTemplateBookingActionByCitizen extends EmailTemplateBase {
	public static CreatedBookingEmail(data) {
		const { citizenEmail, serviceName, serviceProviderText, status, day, time, locationText } = emailMapper(data);
		if (!citizenEmail) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Email not found`);
		}
		return {
			to: [citizenEmail],
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
		const { citizenEmail, serviceName, serviceProviderText, status, day, time, locationText } = emailMapper(data);
		if (!citizenEmail) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Email not found`);
		}
		return {
			to: [citizenEmail],
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
		const { citizenEmail, serviceName, serviceProviderText, status, day, time, locationText } = emailMapper(data);
		if (!citizenEmail) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Email not found`);
		}
		return {
			to: [citizenEmail],
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
		const { citizenEmail, serviceName, serviceProviderText, status, day, time, locationText } = emailMapper(data);
		if (!citizenEmail) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Email not found`);
		}
		return {
			to: [citizenEmail],
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
		const { citizenEmail, serviceName, serviceProviderText, status, day, time, locationText } = emailMapper(data);
		if (!citizenEmail) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Email not found`);
		}
		return {
			to: [citizenEmail],
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
		const { citizenEmail, serviceName, serviceProviderText, status, day, time, locationText } = emailMapper(data);
		if (!citizenEmail) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Email not found`);
		}
		return {
			to: [citizenEmail],
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

export class ServiceProviderEmailTemplateBookingActionByCitizen extends EmailTemplateBase {
	public static CreatedBookingEmail(data) {
		const { serviceProviderEmail, serviceName, serviceProviderText, status, day, time, locationText } = emailMapper(
			data,
		);
		if (!serviceProviderEmail) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Email not found`);
		}
		return {
			to: [serviceProviderEmail],
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
		const { serviceProviderEmail, serviceName, serviceProviderText, status, day, time, locationText } = emailMapper(
			data,
		);
		if (!serviceProviderEmail) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Email not found`);
		}
		return {
			to: [serviceProviderEmail],
			subject: `Booking updated`,
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
		const { serviceProviderEmail, serviceName, serviceProviderText, status, day, time, locationText } = emailMapper(
			data,
		);
		if (!serviceProviderEmail) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Email not found`);
		}
		return {
			to: [serviceProviderEmail],
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

export class ServiceProviderEmailTemplateBookingActionByServiceProvider extends EmailTemplateBase {
	public static UpdatedBookingEmail(data) {
		const { serviceProviderEmail, serviceName, serviceProviderText, status, day, time, locationText } = emailMapper(
			data,
		);
		if (!serviceProviderEmail) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Email not found`);
		}
		return {
			to: [serviceProviderEmail],
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

	public static CancelledBookingEmail(data) {
		const { serviceProviderEmail, serviceName, serviceProviderText, status, day, time, locationText } = emailMapper(
			data,
		);
		if (!serviceProviderEmail) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Email not found`);
		}
		return {
			to: [serviceProviderEmail],
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
