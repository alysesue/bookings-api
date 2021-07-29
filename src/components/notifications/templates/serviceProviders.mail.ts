import { emailMapper } from '../notifications.mapper';
import { EmailBookingTemplate, EmailTemplateBase } from './citizen.mail';
import { EmailNotificationTemplateType } from '../notifications.enum';

export class ServiceProviderEmailTemplateBookingActionByCitizen extends EmailBookingTemplate {
	public async CreatedBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForServiceProvider } = emailMapper(data);
		const templateType = EmailNotificationTemplateType.CreatedByCitizenSentToServiceProvider;
		const emailContent = await this.getEmailContent(data.serviceId, templateType, data);

		return {
			subject: `BookingSG request: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}

	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForServiceProvider } = emailMapper(data);
		const templateType = EmailNotificationTemplateType.UpdatedByCitizenSentToServiceProvider;
		const emailContent = await this.getEmailContent(data.serviceId, templateType, data);

		return {
			subject: `BookingSG update: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}

	public async CancelledBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForServiceProvider } = emailMapper(data);
		const templateType = EmailNotificationTemplateType.CancelledByCitizenSentToServiceProvider;
		const emailContent = await this.getEmailContent(data.serviceId, templateType, data);

		return {
			subject: `BookingSG cancellation: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}
}

export class ServiceProviderEmailTemplateBookingActionByServiceProvider extends EmailBookingTemplate {
	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForServiceProvider } = emailMapper(data);
		const templateType = EmailNotificationTemplateType.UpdatedByServiceProviderSentToServiceProvider;
		const emailContent = await this.getEmailContent(data.serviceId, templateType, data);

		return {
			subject: `BookingSG update: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}

	public async CancelledBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForServiceProvider } = emailMapper(data);
		const templateType = EmailNotificationTemplateType.CancelledByServiceProviderSentToServiceProvider;
		const emailContent = await this.getEmailContent(data.serviceId, templateType, data);

		return {
			subject: `BookingSG cancellation: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}

	public CreatedBookingEmail(_data): Promise<EmailTemplateBase> {
		return undefined;
	}
}
