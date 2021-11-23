import { EmailNotificationTemplateType, EmailRecipient } from '../notifications.enum';
import { eventEmailMapper } from '../notifications.mapper';
import { EmailBookingTemplate, EmailTemplateBase } from './citizen.mail';

export class ServiceProviderEventEmailTemplateBookingActionByCitizen extends EmailBookingTemplate {
	public async CreatedBookingEmail(data): Promise<EmailTemplateBase> {
		const templateType = EmailNotificationTemplateType.CreatedByCitizenSentToServiceProviderEvent;
		const mappedEmailData = eventEmailMapper(data, templateType);
		const emailContent = await this.getEmailContent(
			templateType,
			data,
			mappedEmailData,
			EmailRecipient.ServiceProvider,
		);

		return {
			subject: `BookingSG confirmation: ${mappedEmailData.serviceName}${mappedEmailData.spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}

	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const templateType = EmailNotificationTemplateType.UpdatedByCitizenSentToServiceProviderEvent;
		const mappedEmailData = eventEmailMapper(data, templateType);
		const emailContent = await this.getEmailContent(
			templateType,
			data,
			mappedEmailData,
			EmailRecipient.ServiceProvider,
		);

		return {
			subject: `BookingSG update: ${mappedEmailData.serviceName}${mappedEmailData.spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}

	public async CancelledBookingEmail(data): Promise<EmailTemplateBase> {
		const templateType = EmailNotificationTemplateType.CancelledByCitizenSentToServiceProviderEvent;
		const mappedEmailData = eventEmailMapper(data, templateType);
		const emailContent = await this.getEmailContent(
			templateType,
			data,
			mappedEmailData,
			EmailRecipient.ServiceProvider,
		);

		return {
			subject: `BookingSG cancellation: ${mappedEmailData.serviceName}${mappedEmailData.spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}

	public async ApprovedBySABookingEmail(_data): Promise<EmailTemplateBase> {
		return undefined;
	}
}

export class ServiceProviderEventEmailTemplateBookingActionByServiceProvider extends EmailBookingTemplate {
	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const templateType = EmailNotificationTemplateType.UpdatedByServiceProviderSentToServiceProviderEvent;
		const mappedEmailData = eventEmailMapper(data, templateType);
		const emailContent = await this.getEmailContent(
			templateType,
			data,
			mappedEmailData,
			EmailRecipient.ServiceProvider,
		);

		return {
			subject: `BookingSG update: ${mappedEmailData.serviceName}${mappedEmailData.spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}

	public async CancelledBookingEmail(data): Promise<EmailTemplateBase> {
		const templateType = EmailNotificationTemplateType.CancelledByServiceProviderSentToServiceProviderEvent;
		const mappedEmailData = eventEmailMapper(data, templateType);
		const emailContent = await this.getEmailContent(
			templateType,
			data,
			mappedEmailData,
			EmailRecipient.ServiceProvider,
		);

		return {
			subject: `BookingSG cancellation: ${mappedEmailData.serviceName}${mappedEmailData.spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}

	public async CreatedBookingEmail(data): Promise<EmailTemplateBase> {
		const templateType = EmailNotificationTemplateType.CreatedByServiceProviderSentToServiceProviderEvent;
		const mappedEmailData = eventEmailMapper(data, templateType);
		const emailContent = await this.getEmailContent(
			templateType,
			data,
			mappedEmailData,
			EmailRecipient.ServiceProvider,
		);

		return {
			subject: `BookingSG confirmation: ${mappedEmailData.serviceName}${mappedEmailData.spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}

	public async ApprovedBySABookingEmail(_data): Promise<EmailTemplateBase> {
		return undefined;
	}
}
