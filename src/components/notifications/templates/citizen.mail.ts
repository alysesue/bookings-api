import {
	emailMapper,
	mapVariablesValuesToDefaultTemplate,
	mapVariablesValuesToServiceTemplate,
} from '../notifications.mapper';
import { ServiceNotificationTemplateService } from '../../serviceNotificationTemplate/serviceNotificationTemplate.service';
import { EmailNotificationTemplateType } from '../notifications.enum';
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

	protected getEmailContentFromServiceTemplate = async (
		serviceId: number,
		templateType: EmailNotificationTemplateType,
		bookingData: Booking,
	): Promise<string> => {
		const serviceTemplate = await this.templateService.getEmailServiceNotificationTemplateByType(
			serviceId,
			templateType,
		);

		if (serviceTemplate?.htmlTemplate) {
			const emailContent = mapVariablesValuesToServiceTemplate(
				emailMapper(bookingData, false, getConfig().appURL),
				serviceTemplate.htmlTemplate,
			);
			return emailContent;
		}

		return null;
	};

	protected getEmailContentFromDefaultTemplate = (
		templateType: EmailNotificationTemplateType,
		bookingData: Booking,
	): string => {
		const defaultTemplate = this.notificationsRepository.getDefaultEmailNotificationTemplateByType(templateType);
		const emailContent = mapVariablesValuesToDefaultTemplate(
			emailMapper(bookingData, false, getConfig().appURL),
			defaultTemplate,
		);
		return emailContent;
	};

	protected getEmailContent = async (
		serviceId: number,
		templateType: EmailNotificationTemplateType,
		bookingData: Booking,
	): Promise<string> => {
		let emailContent = await this.getEmailContentFromServiceTemplate(
			bookingData.serviceId,
			templateType,
			bookingData,
		);
		if (!emailContent) {
			emailContent = this.getEmailContentFromDefaultTemplate(templateType, bookingData);
		}
		return emailContent;
	};
}

export class CitizenEmailTemplateBookingActionByCitizen extends EmailBookingTemplate {
	public async CreatedBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForCitizen } = emailMapper(data, false, getConfig().appURL);
		const templateType = EmailNotificationTemplateType.CreatedByCitizenSentToCitizen;
		const emailContent = await this.getEmailContent(data.serviceId, templateType, data);

		return {
			subject: `BookingSG confirmation: ${serviceName}${spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForCitizen } = emailMapper(data, false, getConfig().appURL);
		const templateType = EmailNotificationTemplateType.UpdatedByCitizenSentToCitizen;
		const emailContent = await this.getEmailContent(data.serviceId, templateType, data);

		return {
			subject: `BookingSG update: ${serviceName}${spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async CancelledBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForCitizen } = emailMapper(data, false, getConfig().appURL);
		const templateType = EmailNotificationTemplateType.CancelledByCitizenSentToCitizen;
		const emailContent = await this.getEmailContent(data.serviceId, templateType, data);

		return {
			subject: `BookingSG cancellation: ${serviceName}${spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async ApprovedBySABookingEmail(_data): Promise<EmailTemplateBase> {
		return undefined;
	}
}

export class CitizenEmailTemplateBookingActionByServiceProvider extends EmailBookingTemplate {
	public async CreatedBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForCitizen } = emailMapper(data, false, getConfig().appURL);
		const templateType = EmailNotificationTemplateType.CreatedByServiceProviderSentToCitizen;
		const emailContent = await this.getEmailContent(data.serviceId, templateType, data);

		return {
			subject: `BookingSG confirmation: ${serviceName}${spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForCitizen } = emailMapper(data, false, getConfig().appURL);
		const templateType = EmailNotificationTemplateType.UpdatedByServiceProviderSentToCitizen;
		const emailContent = await this.getEmailContent(data.serviceId, templateType, data);

		return {
			subject: `BookingSG update: ${serviceName}${spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async CancelledBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForCitizen } = emailMapper(data, false, getConfig().appURL);
		const templateType = EmailNotificationTemplateType.CancelledByServiceProviderSentToCitizen;
		const emailContent = await this.getEmailContent(data.serviceId, templateType, data);

		return {
			subject: `BookingSG cancellation: ${serviceName}${spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async ApprovedBySABookingEmail(_data): Promise<EmailTemplateBase> {
		return undefined;
	}
}
