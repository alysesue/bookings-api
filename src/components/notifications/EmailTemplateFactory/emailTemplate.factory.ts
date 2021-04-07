import {CreateEmailRequestApiDomain} from "mol-lib-api-contract/notification/mail/create-email/create-email-api-domain";
import {emailMapper} from "../notifications.mapper";

export abstract class EmailTemplateBase implements CreateEmailRequestApiDomain{
	public to: string[];
	public subject: string;
	public html: string;
}

export class CitizenBookingCreatedTemplateBase extends EmailTemplateBase {
	public static CitizenBookingCreatedEmail(data) {
		const {citizenEmail, serviceName, serviceProviderText, status, day, time, locationText} = emailMapper(data);
		console.log('inside CitizenBookingCreatedEmail');
		return {
			to: [citizenEmail],
			subject: `BookingSG confirmation: ${serviceName}${serviceProviderText}`,
			html: `<pre>
				Your booking request has been received.
				<br />
				Booking for: ${serviceName}${serviceProviderText}.
				<br />
				Below is a confirmation of your booking details.
				Booking status: <b>${status}</b>
				Date: <b>${day}</b>
				Time: <b>${time}</b>
				Location: ${locationText}
				</pre>`,
		};
	}
}

export class CitizenBookingUpdatedTemplateBase extends EmailTemplateBase {
	public static CitizenBookingUpdatedEmail(data) {
		const {citizenEmail, serviceName, serviceProviderText, status, day, time, locationText} = emailMapper(data);
		return {
			to: [citizenEmail],
			subject: `BookingSG confirmation: ${serviceName}${serviceProviderText}`,
			html: `<pre>
				There has been an update to your booking confirmation.
				<br />
				Booking for: ${serviceName}${serviceProviderText}.
				<br />
				Below is a confirmation of your booking details.
				Booking status: <b>${status}</b>
				Date: <b>${day}</b>
				Time: <b>${time}</b>
				Location: ${locationText}
				</pre>`,
		};
	}
}

export class CitizenBookingCancelledBySPTemplateBase extends EmailTemplateBase {
	public static CitizenBookingCancelledBySPEmail(data) {
		const {citizenEmail, serviceName, serviceProviderText, status, day, time, locationText} = emailMapper(data);
		return {
			to: [citizenEmail],
			subject: `BookingSG confirmation: ${serviceName}${serviceProviderText}`,
			html: `<pre>
				The following booking has been cancelled by the other party.
				<br />
				Booking for: ${serviceName}${serviceProviderText}.
				<br />
				Booking status: <b>${status}</b>
				Date: <b>${day}</b>
				Time: <b>${time}</b>
				Location: ${locationText}
				</pre>`,
		};
	}
}

export class CitizenBookingCancelledByCitizenTemplateBase extends EmailTemplateBase {
	public static CitizenBookingCancelledByCitizenEmail(data) {
		const {citizenEmail, serviceName, serviceProviderText, status, day, time, locationText} = emailMapper(data);
		return {
			to: [citizenEmail],
			subject: `BookingSG confirmation: ${serviceName}${serviceProviderText}`,
			html: `<pre>
				You have cancelled the following booking.
				<br />
				Booking for: ${serviceName}${serviceProviderText}.
				<br />
				Booking status: <b>${status}</b>
				Date: <b>${day}</b>
				Time: <b>${time}</b>
				Location: ${locationText}
				</pre>`,
		};
	}
}

export class ServiceProviderBookingCreatedTemplateBase extends EmailTemplateBase {
	public static ServiceProviderBookingCreatedEmail(data) {
		const {citizenEmail, serviceName, serviceProviderText, status, day, time, locationText} = emailMapper(data);
		return {
			to: [citizenEmail],
			subject: `Booking request received`,
			html: `<pre>
				You have received a new booking request.
				<br />
				Booking for: ${serviceName}${serviceProviderText}.
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
}

export class ServiceProviderBookingUpdatedTemplateBase extends EmailTemplateBase {
	public static ServiceProviderBookingUpdatedEmail(data) {
		const {citizenEmail, serviceName, serviceProviderText, status, day, time, locationText} = emailMapper(data);
		return {
			to: [citizenEmail],
			subject: `Booking updated`,
			html: `<pre>
				Your have updated a booking.
				<br />
				Booking for: ${serviceName}${serviceProviderText}.
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
}

export class ServiceProviderBookingCancelledBySPTemplateBase extends EmailTemplateBase {
	public static ServiceProviderBookingCancelledBySPEmail(data) {
		const {citizenEmail, serviceName, serviceProviderText, status, day, time, locationText} = emailMapper(data);
		return {
			to: [citizenEmail],
			subject: `Booking cancelled`,
			html: `<pre>
				You have cancelled the following booking.
				<br />
				Booking for: ${serviceName}${serviceProviderText}.
				<br />
				Booking status: <b>${status}</b>
				Date: <b>${day}</b>
				Time: <b>${time}</b>
				Location: <b>${locationText}</b>
				</pre>`,
		};
	}
}

export class ServiceProviderBookingCancelledByCitizenTemplateBase extends EmailTemplateBase {
	public static ServiceProviderBookingCancelledByCitizenEmail(data) {
		const {citizenEmail, serviceName, serviceProviderText, status, day, time, locationText} = emailMapper(data);
		return {
			to: [citizenEmail],
			subject: `Booking cancelled`,
			html: `<pre>
				The following booking has been cancelled by the other party.
				<br />
				Booking for: ${serviceName}${serviceProviderText}.
				<br />
				Booking status: <b>${status}</b>
				Date: <b>${day}</b>
				Time: <b>${time}</b>
				Location: <b>${locationText}</b>
				</pre>`,
		};
	}
}
