import { BookingStatus } from '../../../models';
import { DateHelper } from '../../../infrastructure/dateHelper';
import {emailMapper} from "../notifications.mapper";

export abstract class EmailTemplateFactory {
	public abstract CreateCitizenEmailTemplateBase();
	public abstract CreateServiceProviderTemplateBase();
}

export abstract class EmailTemplateBase {
	public to: string;
	public subject: string;
	public body: string;
}

export abstract class CitizenEmailTemplateBase extends EmailTemplateBase {
	to: string;
	subject: string;
	body: string;
}

export abstract class ServiceProviderEmailTemplateBase implements EmailTemplateBase {
	to: string;
	subject: string;
	body: string;
}

export class CitizenBookingCreated extends CitizenEmailTemplateBase {
	public CitizenBookingCreatedEmail(data) {
		// this.subject = '';
		// this.body = '';
		const {citizenEmail, serviceName, serviceProviderText, day, time, locationText} = emailMapper(data);
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
				${locationText}
				</pre>`,
		};
	}
}

export class ServiceProviderBookingCreated extends ServiceProviderEmailTemplateBase {
	public ServiceProviderBookingCreatedEmail() {
		this.subject = '';
		this.body = '';
	}
}

export class ServiceProviderBookingUpdated extends ServiceProviderEmailTemplateBase {
	public ServiceProviderBookingUpdatedEmail() {
		this.subject = '';
		this.body = '';
	}
}

export class ServiceProviderBookingCancelled extends ServiceProviderEmailTemplateBase {
	public ServiceProviderBookingCancelled() {
		this.subject = '';
		this.body = '';
	}
}
