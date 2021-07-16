import { emailMapper, mapVariablesValuesToServiceTemplate } from '../notifications.mapper';
import { ServiceNotificationTemplateService } from '../../serviceNotificationTemplate/serviceNotificationTemplate.service';
import { EmailNotificationTemplateType } from '../../../models/notifications';
import { Inject } from 'typescript-ioc';

export abstract class EmailTemplateBase {
	public subject: string;
	public html: string;
}

export abstract class EmailBookingTemplate {
	public abstract CreatedBookingEmail(data): Promise<EmailTemplateBase>;
	public abstract UpdatedBookingEmail(data): Promise<EmailTemplateBase>;
	public abstract CancelledBookingEmail(data): Promise<EmailTemplateBase>;
}

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

		let emailContent;
		let serviceEmailTemplate = '';
		const templateType = EmailNotificationTemplateType.CreatedByCitizenSentToCitizen;
		try {
			const serviceTemplate = await this.templateService.getNotificationTemplate(data.serviceId, templateType);
			serviceEmailTemplate = serviceTemplate.htmlTemplate;
		} catch (e) {}

		if (serviceEmailTemplate) {
			emailContent = mapVariablesValuesToServiceTemplate(emailMapper(data), serviceEmailTemplate);
		} else {
			emailContent = `<pre>
Your booking request has been received.
<br />
Booking for: <b>${serviceName}.</b>
<br />
Below is a confirmation of your booking details.
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
${videoConferenceUrl}
${locationText}
</pre>`;
		}

		return {
			subject: `BookingSG confirmation: ${serviceName}${spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const {
			serviceName,
			spNameDisplayedForCitizen,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);

		let emailContent;
		let serviceEmailTemplate = '';
		const templateType = EmailNotificationTemplateType.UpdatedByCitizenSentToCitizen;
		try {
			const serviceTemplate = await this.templateService.getNotificationTemplate(data.serviceId, templateType);
			serviceEmailTemplate = serviceTemplate.htmlTemplate;
		} catch (e) {}

		if (serviceEmailTemplate) {
			emailContent = mapVariablesValuesToServiceTemplate(emailMapper(data), serviceEmailTemplate);
		} else {
			emailContent = `<pre>
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
</pre>`;
		}

		return {
			subject: `BookingSG update: ${serviceName}${spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async CancelledBookingEmail(data): Promise<EmailTemplateBase> {
		const {
			serviceName,
			spNameDisplayedForCitizen,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);

		let emailContent;
		let serviceEmailTemplate = '';
		const templateType = EmailNotificationTemplateType.CancelledByCitizenSentToCitizen;
		try {
			const serviceTemplate = await this.templateService.getNotificationTemplate(data.serviceId, templateType);
			serviceEmailTemplate = serviceTemplate.htmlTemplate;
		} catch (e) {}

		if (serviceEmailTemplate) {
			emailContent = mapVariablesValuesToServiceTemplate(emailMapper(data), serviceEmailTemplate);
		} else {
			emailContent = `<pre>
You have cancelled the following booking.
<br />
Booking for: <b>${serviceName}${spNameDisplayedForCitizen}.</b>
<br />
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
${videoConferenceUrl}
${locationText}
</pre>`;
		}

		return {
			subject: `BookingSG cancellation: ${serviceName}${spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}
}

export class CitizenEmailTemplateBookingActionByServiceProvider implements EmailBookingTemplate {
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

		let emailContent;
		let serviceEmailTemplate = '';
		const templateType = EmailNotificationTemplateType.CreatedByServiceProviderSentToCitizen;
		try {
			const serviceTemplate = await this.templateService.getNotificationTemplate(data.serviceId, templateType);
			serviceEmailTemplate = serviceTemplate.htmlTemplate;
		} catch (e) {}

		if (serviceEmailTemplate) {
			emailContent = mapVariablesValuesToServiceTemplate(emailMapper(data), serviceEmailTemplate);
		} else {
			emailContent = `<pre>
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
</pre>`;
		}

		return {
			subject: `BookingSG confirmation: ${serviceName}${spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const {
			serviceName,
			spNameDisplayedForCitizen,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);

		let emailContent;
		let serviceEmailTemplate = '';
		const templateType = EmailNotificationTemplateType.UpdatedByServiceProviderSentToCitizen;
		try {
			const serviceTemplate = await this.templateService.getNotificationTemplate(data.serviceId, templateType);
			serviceEmailTemplate = serviceTemplate.htmlTemplate;
		} catch (e) {}

		if (serviceEmailTemplate) {
			emailContent = mapVariablesValuesToServiceTemplate(emailMapper(data), serviceEmailTemplate);
		} else {
			emailContent = `<pre>
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
</pre>`;
		}

		return {
			subject: `BookingSG update: ${serviceName}${spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async CancelledBookingEmail(data): Promise<EmailTemplateBase> {
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

		let emailContent;
		let serviceEmailTemplate = '';
		const templateType = EmailNotificationTemplateType.CancelledByServiceProviderSentToCitizen;
		try {
			const serviceTemplate = await this.templateService.getNotificationTemplate(data.serviceId, templateType);
			serviceEmailTemplate = serviceTemplate.htmlTemplate;
		} catch (e) {}

		if (serviceEmailTemplate) {
			emailContent = mapVariablesValuesToServiceTemplate(emailMapper(data), serviceEmailTemplate);
		} else {
			emailContent = `<pre>
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
</pre>`;
		}

		return {
			subject: `BookingSG cancellation: ${serviceName}${spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}
}
