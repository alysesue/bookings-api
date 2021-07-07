import { Inject, InRequestScope } from 'typescript-ioc';
import { ServiceNotificationTemplate } from '../../models';
import { ServiceNotificationTemplateRequest } from '../serviceNotificationTemplate/serviceNotificationTemplate.apicontract';
import { NotificationTemplateRepository } from '../serviceNotificationTemplate/serviceNotificationTemplate.repository';
import { EmailNotificationTemplateType } from '../../models/notifications';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';

@InRequestScope
export class ServiceNotificationsTemplatesService {
	@Inject
	private notificationTemplateRepository: NotificationTemplateRepository;

	public async getEmailNotificationTemplate(
		serviceId: number,
		emailTemplateType: EmailNotificationTemplateType,
	): Promise<ServiceNotificationTemplate> {
		return await this.getNotificationTemplate(serviceId, emailTemplateType);
	}

	private async getNotificationTemplate(
		serviceId: number,
		emailTemplateType: EmailNotificationTemplateType,
	): Promise<ServiceNotificationTemplate> {
		const templateData = await this.notificationTemplateRepository.getTemplate(serviceId, emailTemplateType);
		if (!templateData) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(
				`Template of type ${EmailNotificationTemplateType[emailTemplateType].toString()} not found`,
			);
		}
		return templateData;
	}

	public async addEmailTemplate(
		serviceId: number,
		request: ServiceNotificationTemplateRequest,
	): Promise<ServiceNotificationTemplate> {
		const emailNotification = ServiceNotificationTemplate.create(
			request.htmlTemplate,
			serviceId,
			request.emailTemplateType,
		);
		return await this.notificationTemplateRepository.save(emailNotification);
	}
}
