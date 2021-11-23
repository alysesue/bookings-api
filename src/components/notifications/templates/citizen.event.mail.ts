import { getConfig } from '../../../config/app-config';
import { EmailNotificationTemplateType } from '../notifications.enum';
import { eventEmailMapper } from '../notifications.mapper';
import { EmailBookingTemplate, EmailTemplateBase } from './citizen.mail';

export class CitizenEventEmailTemplateBookingActionByCitizen extends EmailBookingTemplate {
	public async CreatedBookingEmail(data): Promise<EmailTemplateBase> {
		const templateType = EmailNotificationTemplateType.CreatedByCitizenSentToCitizenEvent;
		const mappedEmailData = eventEmailMapper(data, templateType, false, getConfig().appURL);
		const emailContent = await this.getEmailContent(templateType, data, mappedEmailData);

		return {
			subject: `BookingSG confirmation: ${mappedEmailData.eventName} - ${mappedEmailData.serviceName}`,
			html: emailContent,
		};
	}

	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const templateType = EmailNotificationTemplateType.UpdatedByCitizenSentToCitizenEvent;
		const mappedEmailData = eventEmailMapper(data, templateType, false, getConfig().appURL);
		const emailContent = await this.getEmailContent(templateType, data, mappedEmailData);

		return {
			subject: `BookingSG update: ${mappedEmailData.eventName} - ${mappedEmailData.serviceName}`,
			html: emailContent,
		};
	}

	public async CancelledBookingEmail(data): Promise<EmailTemplateBase> {
		const templateType = EmailNotificationTemplateType.CancelledByCitizenSentToCitizenEvent;
		const mappedEmailData = eventEmailMapper(data, templateType, false, getConfig().appURL);
		const emailContent = await this.getEmailContent(templateType, data, mappedEmailData);

		return {
			subject: `BookingSG cancellation: ${mappedEmailData.eventName} - ${mappedEmailData.serviceName}`,
			html: emailContent,
		};
	}

	public async ApprovedBySABookingEmail(_data): Promise<EmailTemplateBase> {
		return undefined;
	}
}

export class CitizenEventEmailTemplateBookingActionByServiceProvider extends EmailBookingTemplate {
	public async CreatedBookingEmail(data): Promise<EmailTemplateBase> {
		const templateType = EmailNotificationTemplateType.CreatedByServiceProviderSentToCitizenEvent;
		const mappedEmailData = eventEmailMapper(data, templateType, false, getConfig().appURL);
		const emailContent = await this.getEmailContent(templateType, data, mappedEmailData);

		return {
			subject: `BookingSG confirmation: ${mappedEmailData.eventName} - ${mappedEmailData.serviceName}`,
			html: emailContent,
		};
	}

	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const templateType = EmailNotificationTemplateType.UpdatedByServiceProviderSentToCitizenEvent;
		const mappedEmailData = eventEmailMapper(data, templateType, false, getConfig().appURL);
		const emailContent = await this.getEmailContent(templateType, data, mappedEmailData);

		return {
			subject: `BookingSG update: ${mappedEmailData.eventName} - ${mappedEmailData.serviceName}`,
			html: emailContent,
		};
	}

	public async CancelledBookingEmail(data): Promise<EmailTemplateBase> {
		const templateType = EmailNotificationTemplateType.CancelledByServiceProviderSentToCitizenEvent;
		const mappedEmailData = eventEmailMapper(data, templateType, false, getConfig().appURL);
		const emailContent = await this.getEmailContent(templateType, data, mappedEmailData);

		return {
			subject: `BookingSG cancellation: ${mappedEmailData.eventName} - ${mappedEmailData.serviceName}`,
			html: emailContent,
		};
	}

	public async ApprovedBySABookingEmail(_data): Promise<EmailTemplateBase> {
		return undefined;
	}
}
