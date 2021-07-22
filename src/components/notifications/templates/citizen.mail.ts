import { emailMapper, mapVariablesValuesToServiceTemplate } from '../notifications.mapper';
import { ServiceNotificationTemplateService } from '../../serviceNotificationTemplate/serviceNotificationTemplate.service';
import { EmailNotificationTemplateType } from '../notifications.enum';
import { Inject } from 'typescript-ioc';
import { Booking } from '../../../models';

export abstract class EmailTemplateBase {
	public subject: string;
	public html: string;
}

export abstract class EmailBookingTemplate {
	public abstract CreatedBookingEmail(data): Promise<EmailTemplateBase>;
	public abstract UpdatedBookingEmail(data): Promise<EmailTemplateBase>;
	public abstract CancelledBookingEmail(data): Promise<EmailTemplateBase>;
}

export const getEmailContentFromServiceTemplate = async (
	serviceId: number,
	templateType: EmailNotificationTemplateType,
	data: Booking,
	templateService: ServiceNotificationTemplateService,
): Promise<string> => {
	const serviceTemplate = await templateService.getEmailServiceNotificationTemplateByType(serviceId, templateType);
	if (serviceTemplate) {
		if (serviceTemplate.htmlTemplate) {
			const emailContent = mapVariablesValuesToServiceTemplate(emailMapper(data), serviceTemplate.htmlTemplate);
			return emailContent;
		}
	}
	return null;
};

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
		const serviceTemplate = await this.templateService.getEmailServiceNotificationTemplateByType(
			data.serviceId,
			templateType,
		);
		if (serviceTemplate) {
			serviceEmailTemplate = serviceTemplate.htmlTemplate;
		}
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
		const serviceTemplate = await this.templateService.getEmailServiceNotificationTemplateByType(
			data.serviceId,
			templateType,
		);
		if (serviceTemplate) {
			serviceEmailTemplate = serviceTemplate.htmlTemplate;
		}
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
		const serviceTemplate = await this.templateService.getEmailServiceNotificationTemplateByType(
			data.serviceId,
			templateType,
		);
		if (serviceTemplate) {
			serviceEmailTemplate = serviceTemplate.htmlTemplate;
		}
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
		const serviceTemplate = await this.templateService.getEmailServiceNotificationTemplateByType(
			data.serviceId,
			templateType,
		);
		if (serviceTemplate) {
			serviceEmailTemplate = serviceTemplate.htmlTemplate;
		}
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
		const serviceTemplate = await this.templateService.getEmailServiceNotificationTemplateByType(
			data.serviceId,
			templateType,
		);
		if (serviceTemplate) {
			serviceEmailTemplate = serviceTemplate.htmlTemplate;
		}
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
		const serviceTemplate = await this.templateService.getEmailServiceNotificationTemplateByType(
			data.serviceId,
			templateType,
		);
		if (serviceTemplate) {
			serviceEmailTemplate = serviceTemplate.htmlTemplate;
		}
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
