import { emailMapper } from '../notifications.mapper';
import { ServiceNotificationTemplateService } from '../../serviceNotificationTemplate/serviceNotificationTemplate.service';
import { EmailNotificationTemplateType } from '../../../models/notifications';
import { Inject } from 'typescript-ioc';

export abstract class EmailTemplateBase {
	public subject: string;
	public html: string;
}

export abstract class EmailBookingTemplate {
	public abstract CreatedBookingEmail(data): Promise<EmailTemplateBase>;
	public abstract UpdatedBookingEmail(data): EmailTemplateBase;
	public abstract CancelledBookingEmail(data): EmailTemplateBase;
}

// CreatedByCitizenSentToCitizen = 1,
// 	UpdatedByCitizenSentToCitizen,
// 	CancelledByCitizenSentToCitizen,
// 	CreatedByCitizenSentToServiceProvider,
// 	UpdatedByCitizenSentToServiceProvider,
// 	CancelledByCitizenSentToServiceProvider,
// 	CreatedByServiceProviderSentToCitizen,
// 	UpdatedByServiceProviderSentToCitizen,
// 	CancelledByServiceProviderSentToCitizen,
// 	CreatedByServiceProviderSentToServiceProvider, // currently undefined
// 	UpdatedByServiceProviderSentToServiceProvider,
// 	CancelledByServiceProviderSentToServiceProvider,

export class CitizenEmailTemplateBookingActionByCitizen implements EmailBookingTemplate {
	@Inject
	public templateService: ServiceNotificationTemplateService;

	public async CreatedBookingEmail(data): Promise<EmailTemplateBase> {
		const {
			serviceName,
			spNameDisplayedForCitizen,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);

		const templateType = EmailNotificationTemplateType.CreatedByCitizenSentToCitizen;
		const serviceTemplate = await this.templateService.getEmailNotificationTemplate(data.serviceId, templateType);
		if (serviceTemplate && serviceTemplate.htmlTemplate) {
			const mapVariables = {
				'{serviceName}': serviceName,
				'{spNameDisplayedForCitizen}': spNameDisplayedForCitizen,
				'{status}': status,
				'{day}': day,
				'{time}': time,
				'{locationText}': locationText,
				'{videoConferenceUrl}': videoConferenceUrl,
			};

			let template = serviceTemplate.htmlTemplate;
			for (const key of Object.keys(mapVariables)) {
				template = template.replace(new RegExp(key, 'g'), mapVariables[key]);
			}

			return {
				subject: `Service Template 1880 confirmation: ${serviceName}${spNameDisplayedForCitizen}`,
				html: template,
			};
		} else
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
	public async CreatedBookingEmail(data): Promise<EmailTemplateBase> {
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
			reasonToReject,
		} = emailMapper(data);

		return {
			subject: `BookingSG cancellation: ${serviceName}${spNameDisplayedForCitizen}`,
			html: `<pre>
The following booking has been cancelled by the other party.
${reasonToReject}
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
