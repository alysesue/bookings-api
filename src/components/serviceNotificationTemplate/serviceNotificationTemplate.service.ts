import { Inject, InRequestScope } from 'typescript-ioc';
import { ServiceNotificationTemplate } from '../../models';

import { ServiceNotificationTemplateRequest } from '../serviceNotificationTemplate/serviceNotificationTemplate.apicontract';
import { NotificationTemplateRepository } from '../serviceNotificationTemplate/serviceNotificationTemplate.repository';
import { EmailNotificationTemplateType } from '../../models/notifications';

@InRequestScope
export class ServiceNotificationsTemplatesService {
	// @Inject
	// private molUsersService: MolUsersService;
	// @Inject
	// private userContext: UserContext;
	// @Inject
	// private containerContext: ContainerContext;
	@Inject
	private notificationTemplateRepository: NotificationTemplateRepository;

	public async getEmailNotificationTemplate(
		serviceId: number,
		emailTemplateType: EmailNotificationTemplateType,
	): Promise<ServiceNotificationTemplate> {
		const templateData = await this.getNotificationTemplate(serviceId, emailTemplateType);
		// if (!templateData) {
		//     return await this.servicesService.getServiceTimeslotsSchedule(serviceProvider.serviceId);
		// }
		return templateData;
	}

	public async addEmailTemplate(serviceId: number, request: ServiceNotificationTemplateRequest): Promise<number> {
		const emailNotification = ServiceNotificationTemplate.create(
			request.htmlTemplate,
			serviceId,
			request.emailTemplateType,
		);
		await this.notificationTemplateRepository.save(emailNotification);
		console.log('addEmailTemplate', emailNotification);
		return emailNotification.serviceId;
	}

	public async getNotificationTemplate(
		serviceId: number,
		emailTemplateType: EmailNotificationTemplateType,
	): Promise<ServiceNotificationTemplate> {
		// const validator = this.getValidator();
		const templateData = await this.notificationTemplateRepository.getTemplate(serviceId, emailTemplateType);
		// await validator.validateServiceFound(service);
		// Or if(!templateData)...

		return templateData;
	}
}
