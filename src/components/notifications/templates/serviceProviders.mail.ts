import { emailMapper, mapVariablesValuesToDefaultTemplate } from '../notifications.mapper';
import { EmailBookingTemplate, EmailTemplateBase, getEmailContentFromServiceTemplate } from './citizen.mail';
import { EmailNotificationTemplateType } from '../notifications.enum';
import { ServiceNotificationTemplateService } from '../../serviceNotificationTemplate/serviceNotificationTemplate.service';
import { Inject } from 'typescript-ioc';
import { NotificationsRepository } from '../notifications.repository';

export class ServiceProviderEmailTemplateBookingActionByCitizen implements EmailBookingTemplate {
	@Inject
	public templateService: ServiceNotificationTemplateService;
	@Inject
	private notificationsRepository: NotificationsRepository;

	public async CreatedBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForServiceProvider } = emailMapper(data);

		const templateType = EmailNotificationTemplateType.CreatedByCitizenSentToServiceProvider;
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
			subject: `BookingSG request: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}

	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForServiceProvider } = emailMapper(data);

		const templateType = EmailNotificationTemplateType.UpdatedByCitizenSentToServiceProvider;
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
			subject: `BookingSG update: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}

	public async CancelledBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForServiceProvider } = emailMapper(data);

		const templateType = EmailNotificationTemplateType.CancelledByCitizenSentToServiceProvider;
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
			subject: `BookingSG cancellation: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}
}

export class ServiceProviderEmailTemplateBookingActionByServiceProvider implements EmailBookingTemplate {
	@Inject
	public templateService: ServiceNotificationTemplateService;
	@Inject
	private notificationsRepository: NotificationsRepository;

	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForServiceProvider } = emailMapper(data);

		const templateType = EmailNotificationTemplateType.UpdatedByServiceProviderSentToServiceProvider;
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
			subject: `BookingSG update: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}

	public async CancelledBookingEmail(data): Promise<EmailTemplateBase> {
		const { serviceName, spNameDisplayedForServiceProvider } = emailMapper(data);

		const templateType = EmailNotificationTemplateType.CancelledByServiceProviderSentToServiceProvider;
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
			subject: `BookingSG cancellation: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}

	public CreatedBookingEmail(_data): Promise<EmailTemplateBase> {
		return undefined;
	}
}
