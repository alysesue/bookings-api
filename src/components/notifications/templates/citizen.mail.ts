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
	bookingData: Booking,
	templateService: ServiceNotificationTemplateService,
): Promise<string> => {
	const serviceTemplate = await templateService.getEmailServiceNotificationTemplateByType(serviceId, templateType);
	if (serviceTemplate) {
		if (serviceTemplate.htmlTemplate) {
			const emailContent = mapVariablesValuesToServiceTemplate(
				emailMapper(bookingData),
				serviceTemplate.htmlTemplate,
			);
			return emailContent;
		}
	}
	return null;
};

export class CitizenEmailTemplateBookingActionByCitizen implements EmailBookingTemplate {
	@Inject
	public templateService: ServiceNotificationTemplateService;
	@Inject
	private notificationsRepository: NotificationsRepository;

	public async CreatedBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForCitizen } = emailMapper(data);

		const templateType = EmailNotificationTemplateType.CreatedByCitizenSentToCitizen;
		let emailContent = await getEmailContentFromServiceTemplate(
			data.serviceId,
			templateType,
			data,
			this.templateService,
		);
		if (!emailContent) {
			const defaultTemplate = this.notificationsRepository.getDefaultEmailNotificationTemplateByType(
				templateType,
			);
			emailContent = mapVariablesValuesToDefaultTemplate(emailMapper(data), defaultTemplate);
		}

		return {
			subject: `BookingSG confirmation: ${serviceName}${spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForCitizen } = emailMapper(data);

		const templateType = EmailNotificationTemplateType.UpdatedByCitizenSentToCitizen;
		let emailContent = await getEmailContentFromServiceTemplate(
			data.serviceId,
			templateType,
			data,
			this.templateService,
		);
		if (!emailContent) {
			const defaultTemplate = this.notificationsRepository.getDefaultEmailNotificationTemplateByType(
				templateType,
			);
			emailContent = mapVariablesValuesToDefaultTemplate(emailMapper(data), defaultTemplate);
		}

		return {
			subject: `BookingSG update: ${serviceName}${spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async CancelledBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForCitizen } = emailMapper(data);

		const templateType = EmailNotificationTemplateType.CancelledByCitizenSentToCitizen;
		let emailContent = await getEmailContentFromServiceTemplate(
			data.serviceId,
			templateType,
			data,
			this.templateService,
		);
		if (!emailContent) {
			const defaultTemplate = this.notificationsRepository.getDefaultEmailNotificationTemplateByType(
				templateType,
			);
			emailContent = mapVariablesValuesToDefaultTemplate(emailMapper(data), defaultTemplate);
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
	@Inject
	private notificationsRepository: NotificationsRepository;

	public async CreatedBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForCitizen } = emailMapper(data);

		const templateType = EmailNotificationTemplateType.CreatedByServiceProviderSentToCitizen;
		let emailContent = await getEmailContentFromServiceTemplate(
			data.serviceId,
			templateType,
			data,
			this.templateService,
		);
		if (!emailContent) {
			const defaultTemplate = this.notificationsRepository.getDefaultEmailNotificationTemplateByType(
				templateType,
			);
			emailContent = mapVariablesValuesToDefaultTemplate(emailMapper(data), defaultTemplate);
		}

		return {
			subject: `BookingSG confirmation: ${serviceName}${spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForCitizen } = emailMapper(data);

		const templateType = EmailNotificationTemplateType.UpdatedByServiceProviderSentToCitizen;
		let emailContent = await getEmailContentFromServiceTemplate(
			data.serviceId,
			templateType,
			data,
			this.templateService,
		);
		if (!emailContent) {
			const defaultTemplate = this.notificationsRepository.getDefaultEmailNotificationTemplateByType(
				templateType,
			);
			emailContent = mapVariablesValuesToDefaultTemplate(emailMapper(data), defaultTemplate);
		}

		return {
			subject: `BookingSG update: ${serviceName}${spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}

	public async CancelledBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForCitizen } = emailMapper(data);

		const templateType = EmailNotificationTemplateType.CancelledByServiceProviderSentToCitizen;
		let emailContent = await getEmailContentFromServiceTemplate(
			data.serviceId,
			templateType,
			data,
			this.templateService,
		);
		if (!emailContent) {
			const defaultTemplate = this.notificationsRepository.getDefaultEmailNotificationTemplateByType(
				templateType,
			);
			emailContent = mapVariablesValuesToDefaultTemplate(emailMapper(data), defaultTemplate);
		}
		return {
			subject: `BookingSG cancellation: ${serviceName}${spNameDisplayedForCitizen}`,
			html: emailContent,
		};
	}
}
