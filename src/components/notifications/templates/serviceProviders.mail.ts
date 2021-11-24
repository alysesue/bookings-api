import { emailMapper } from '../notifications.mapper';
import { EmailBookingTemplate, EmailTemplateBase } from './citizen.mail';
import { EmailNotificationTemplateType, EmailRecipient } from '../notifications.enum';

export class ServiceProviderEmailTemplateBookingActionByCitizen extends EmailBookingTemplate {
	public async CreatedBookingEmail(data): Promise<EmailTemplateBase> {
		const mappedEmailData = emailMapper(data);
		const templateType = EmailNotificationTemplateType.CreatedByCitizenSentToServiceProvider;
		const emailContent = await this.getEmailContent(
			templateType,
			data,
			mappedEmailData,
			EmailRecipient.ServiceProvider,
		);

		return {
			subject: `BookingSG request: ${mappedEmailData.serviceName}${mappedEmailData.spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}

	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const mappedEmailData = emailMapper(data);
		const templateType = EmailNotificationTemplateType.UpdatedByCitizenSentToServiceProvider;
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
		const mappedEmailData = emailMapper(data);
		const templateType = EmailNotificationTemplateType.CancelledByCitizenSentToServiceProvider;
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

export class ServiceProviderEmailTemplateBookingActionByServiceProvider extends EmailBookingTemplate {
	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const mappedEmailData = emailMapper(data);
		const templateType = EmailNotificationTemplateType.UpdatedByServiceProviderSentToServiceProvider;
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
		const mappedEmailData = emailMapper(data);
		const templateType = EmailNotificationTemplateType.CancelledByServiceProviderSentToServiceProvider;
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

	public CreatedBookingEmail(_data): Promise<EmailTemplateBase> {
		return undefined;
	}

	// Using created by EmailNotificationTemplateType.CreatedByCitizenSentToServiceProvider, because after approval by Admin it would be treated as if the citizen created a new booking for this service provider
	public async ApprovedBySABookingEmail(data): Promise<EmailTemplateBase> {
		const mappedEmailData = emailMapper(data);
		const templateType = EmailNotificationTemplateType.CreatedByCitizenSentToServiceProvider;
		const emailContent = await this.getEmailContent(
			templateType,
			data,
			mappedEmailData,
			EmailRecipient.ServiceProvider,
		);

		return {
			subject: `BookingSG approval: ${mappedEmailData.serviceName}${mappedEmailData.spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}
}
