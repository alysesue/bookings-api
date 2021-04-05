import { emailMapper } from "../notifications.mapper";

export abstract class EmailTemplateFactory {
	public abstract CitizenBookingCreatedEmail(): CitizenBookingCreatedTemplateBase;
	public abstract CitizenBookingUpdatedEmail(): CitizenBookingUpdatedTemplateBase;
	public abstract CitizenBookingCancelledBySPEmail(): CitizenBookingCancelledBySPTemplateBase;
	public abstract CitizenBookingCancelledByCitizenEmail(): CitizenBookingCancelledByCitizenTemplateBase;
	public abstract ServiceProviderBookingCreatedEmail(): ServiceProviderBookingCreatedTemplateBase;
	public abstract ServiceProviderBookingUpdatedEmail(): ServiceProviderBookingUpdatedTemplateBase;
	public abstract ServiceProviderBookingCancelledBySPEmail(): ServiceProviderBookingCancelledBySPTemplateBase;
	public abstract ServiceProviderBookingCancelledByCitizenEmail(): ServiceProviderBookingCancelledByCitizenTemplateBase;
}

export abstract class EmailTemplateBase {
	public to: string;
	public subject: string;
	public html: string;
}

export abstract class CitizenEmailTemplateBase extends EmailTemplateBase {
	to: string;
	subject: string;
	html: string;
}

export abstract class ServiceProviderEmailTemplateBase implements EmailTemplateBase {
	to: string;
	subject: string;
	html: string;
}

export class CitizenBookingCreatedTemplateBase extends CitizenEmailTemplateBase {
	public CitizenBookingCreatedEmail(data) {
		const {email, serviceName, serviceProviderText, day, time, locationText} = emailMapper(data);
		return {
			to: [email],
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

export class CitizenBookingUpdatedTemplateBase extends CitizenEmailTemplateBase {
	public CitizenBookingUpdatedEmail(data) {
		const {email, serviceName, serviceProviderText, day, time, locationText} = emailMapper(data);
		return {
			to: [email],
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

export class CitizenBookingCancelledBySPTemplateBase extends CitizenEmailTemplateBase {
	public CitizenBookingCancelledBySPEmail(data) {
		const {email, serviceName, serviceProviderText, day, time, locationText} = emailMapper(data);
		return {
			to: [email],
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

export class CitizenBookingCancelledByCitizenTemplateBase extends CitizenEmailTemplateBase {
	public CitizenBookingCancelledByCitizenEmail(data) {
		const {email, serviceName, serviceProviderText, day, time, locationText} = emailMapper(data);
		return {
			to: [email],
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

export class ServiceProviderBookingCreatedTemplateBase extends ServiceProviderEmailTemplateBase {
	public ServiceProviderBookingCreatedEmail(data) {
		const {email, serviceName, serviceProviderText, day, time, locationText} = emailMapper(data);
		return {
			to: [email],
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

export class ServiceProviderBookingUpdatedTemplateBase extends ServiceProviderEmailTemplateBase {
	public ServiceProviderBookingUpdatedEmail(data) {
		const {email, serviceName, serviceProviderText, day, time, locationText} = emailMapper(data);
		return {
			to: [email],
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

export class ServiceProviderBookingCancelledBySPTemplateBase extends ServiceProviderEmailTemplateBase {
	public ServiceProviderBookingCancelledBySPEmail(data) {
		const {email, serviceName, serviceProviderText, day, time, locationText} = emailMapper(data);
		return {
			to: [email],
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

export class ServiceProviderBookingCancelledByCitizenTemplateBase extends ServiceProviderEmailTemplateBase {
	public ServiceProviderBookingCancelledByCitizenEmail(data) {
		const {email, serviceName, serviceProviderText, day, time, locationText} = emailMapper(data);
		return {
			to: [email],
			subject: `Booking cancelled`,
			html: `<pre>
				The following bookinghas been cancelled by the other party.
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
