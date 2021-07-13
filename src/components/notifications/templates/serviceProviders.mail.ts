import { EmailBookingTemplate, EmailTemplateBase } from './citizen.mail';
import { emailMapper } from '../notifications.mapper';
import {EmailNotificationTemplateType} from "../../../models/notifications";
import {Inject} from "typescript-ioc";
import {ServiceNotificationTemplateService} from "../../serviceNotificationTemplate/serviceNotificationTemplate.service";

export class ServiceProviderEmailTemplateBookingActionByCitizen implements EmailBookingTemplate {
	@Inject
	public templateService: ServiceNotificationTemplateService;
	public async CreatedBookingEmail(data): Promise<EmailTemplateBase> {
		const {
			serviceName,
			spNameDisplayedForServiceProvider,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);

		const templateType = EmailNotificationTemplateType.CreatedByCitizenSentToCitizen;
		 await this.templateService.getEmailNotificationTemplate(data.serviceId, templateType);

		return {
			subject: `BookingSG request: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: `<pre>
You have received a new booking request.
<br />
Booking for: <b>${serviceName}${spNameDisplayedForServiceProvider}.</b>
<br />
Below is a summary of the booking request details.
<br/>
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
${videoConferenceUrl}
${locationText}
</pre>`,
		};
	}

	public UpdatedBookingEmail(data) {
		const {
			serviceName,
			spNameDisplayedForServiceProvider,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);
		return {
			subject: `BookingSG update: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: `<pre>
There has been an update to the following booking by the other party.
<br />
Booking for: <b>${serviceName}${spNameDisplayedForServiceProvider}.</b>
<br />
Below is a confirmation of the updated booking details.
<br/>
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
${videoConferenceUrl}
${locationText}
</pre>`,
		};
	}

	public CancelledBookingEmail(data) {
		const {
			serviceName,
			spNameDisplayedForServiceProvider,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);
		return {
			subject: `BookingSG cancellation: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: `<pre>
The following booking has been cancelled by the other party.
<br />
Booking for: <b>${serviceName}${spNameDisplayedForServiceProvider}.</b>
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

export class ServiceProviderEmailTemplateBookingActionByServiceProvider implements EmailBookingTemplate {
	public UpdatedBookingEmail(data) {
		const {
			serviceName,
			spNameDisplayedForServiceProvider,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);
		return {
			subject: `BookingSG update: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: `<pre>
You have updated a booking.
<br />
Booking for: <b>${serviceName}${spNameDisplayedForServiceProvider}.</b>
<br />
Below is a summary of your updated booking details.
<br/>
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
			spNameDisplayedForServiceProvider,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);
		return {
			subject: `BookingSG cancellation: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: `<pre>
You have cancelled the following booking.
<br />
Booking for: <b>${serviceName}${spNameDisplayedForServiceProvider}.</b>
<br />
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
${videoConferenceUrl}
${locationText}
</pre>`,
		};
	}

	public CreatedBookingEmail(_data): Promise<EmailTemplateBase> {
		return undefined;
	}
}
