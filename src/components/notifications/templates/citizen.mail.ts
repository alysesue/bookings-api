import { EmailData, emailMapper, mapVariablesValuesToTemplate } from '../notifications.mapper';
import { ServiceNotificationTemplateService } from '../../serviceNotificationTemplate/serviceNotificationTemplate.service';
import { EmailNotificationTemplateType, EmailRecipient } from '../notifications.enum';
import { Inject } from 'typescript-ioc';
import { Booking } from '../../../models';
import { NotificationsRepository } from '../notifications.repository';
import { getConfig } from '../../../config/app-config';
export abstract class EmailTemplateBase {
	public subject: string;
	public html: string;
}

export abstract class EmailBookingTemplate {
	@Inject
	public templateService: ServiceNotificationTemplateService;
	@Inject
	private notificationsRepository: NotificationsRepository;

	public abstract CreatedBookingEmail(data): Promise<EmailTemplateBase>;
	public abstract UpdatedBookingEmail(data): Promise<EmailTemplateBase>;
	public abstract CancelledBookingEmail(data): Promise<EmailTemplateBase>;
	public abstract ApprovedBySABookingEmail(data): Promise<EmailTemplateBase>;

	protected getEmailContent = async (
		templateType: EmailNotificationTemplateType,
		bookingData: Booking,
		mappedEmailData: Partial<EmailData>,
		receipient: EmailRecipient = EmailRecipient.Citizen, // Default citizen
	): Promise<string> => {
		const serviceTemplate = await this.templateService.getEmailServiceNotificationTemplateByType(
			bookingData.serviceId,
			templateType,
		);
		let template = serviceTemplate?.htmlTemplate;

		if (!template) {
			template = this.notificationsRepository.getDefaultEmailNotificationTemplateByType(templateType);
		}

		return mapVariablesValuesToTemplate(mappedEmailData, template, receipient);
	};
}

export class CitizenEmailTemplateBookingActionByCitizen extends EmailBookingTemplate {
	public async CreatedBookingEmail(data): Promise<EmailTemplateBase> {
		const mappedEmailData = emailMapper(data, false, getConfig().appURL);
		const templateType = EmailNotificationTemplateType.CreatedByCitizenSentToCitizen;
		const emailContent = await this.getEmailContent(templateType, data, mappedEmailData);

		return {
			subject: `BookingSG confirmation: ${mappedEmailData.serviceName}${mappedEmailData.spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const mappedEmailData = emailMapper(data, false, getConfig().appURL);
		const templateType = EmailNotificationTemplateType.UpdatedByCitizenSentToCitizen;
		const emailContent = await this.getEmailContent(templateType, data, mappedEmailData);

		return {
			subject: `BookingSG update: ${mappedEmailData.serviceName}${mappedEmailData.spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async CancelledBookingEmail(data): Promise<EmailTemplateBase> {
		const mappedEmailData = emailMapper(data, false, getConfig().appURL);
		const templateType = EmailNotificationTemplateType.CancelledByCitizenSentToCitizen;
		const emailContent = await this.getEmailContent(templateType, data, mappedEmailData);

		return {
			subject: `BookingSG cancellation: ${mappedEmailData.serviceName}${mappedEmailData.spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async ApprovedBySABookingEmail(_data): Promise<EmailTemplateBase> {
		return undefined;
	}
}

export class CitizenEmailTemplateBookingActionByServiceProvider extends EmailBookingTemplate {
	public async CreatedBookingEmail(data): Promise<EmailTemplateBase> {
		const mappedEmailData = emailMapper(data, false, getConfig().appURL);
		const templateType = EmailNotificationTemplateType.CreatedByServiceProviderSentToCitizen;
		const emailContent = await this.getEmailContent(templateType, data, mappedEmailData);

		return {
			subject: `BookingSG confirmation: ${mappedEmailData.serviceName}${mappedEmailData.spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const mappedEmailData = emailMapper(data, false, getConfig().appURL);
		const templateType = EmailNotificationTemplateType.UpdatedByServiceProviderSentToCitizen;
		const emailContent = await this.getEmailContent(templateType, data, mappedEmailData);

		return {
			subject: `BookingSG update: ${mappedEmailData.serviceName}${mappedEmailData.spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async CancelledBookingEmail(data): Promise<EmailTemplateBase> {
		const mappedEmailData = emailMapper(data, false, getConfig().appURL);
		const templateType = EmailNotificationTemplateType.CancelledByServiceProviderSentToCitizen;
		const emailContent = await this.getEmailContent(templateType, data, mappedEmailData);

		return {
			subject: `BookingSG cancellation: ${mappedEmailData.serviceName}${mappedEmailData.spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async ApprovedBySABookingEmail(_data): Promise<EmailTemplateBase> {
		return undefined;
	}
}
