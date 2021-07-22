import { Inject, InRequestScope } from 'typescript-ioc';
import { Service, ServiceNotificationTemplate } from '../../models';
import { ServiceNotificationTemplateRequest } from '../serviceNotificationTemplate/serviceNotificationTemplate.apicontract';
import { ServiceNotificationTemplateRepository } from '../serviceNotificationTemplate/serviceNotificationTemplate.repository';
import { EmailNotificationTemplateType } from '../../enums/notifications';
import { UserContext } from '../../infrastructure/auth/userContext';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { CrudAction } from '../../enums/crudAction';
import { ServicesService } from '../services/services.service';
import { NotificationTemplateActionAuthVisitor } from './serviceNotificationTemplate.auth';
import { NotificationsRepository } from '../notifications/notifications.repository';

@InRequestScope
export class ServiceNotificationTemplateService {
	@Inject
	private notificationTemplateRepository: ServiceNotificationTemplateRepository;
	@Inject
	public servicesService: ServicesService;
	@Inject
	private userContext: UserContext;
	@Inject
	private notificationsRepository: NotificationsRepository;

	private async verifyActionPermission(service: Service, action: CrudAction): Promise<void> {
		const authGroups = await this.userContext.getAuthGroups();
		if (!new NotificationTemplateActionAuthVisitor(service, action).hasPermission(authGroups)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
				`User cannot perform this action (${action}) for service notification template.`,
			);
		}
	}

	public async getEmailNotificationTemplateByType(
		serviceId: number,
		emailTemplateType: EmailNotificationTemplateType,
	): Promise<ServiceNotificationTemplate> {
		// Get an email notification template of a service, by type.
		// If service template does not exist, then get the default template.

		if (!emailTemplateType) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Invalid request`);
		}

		let responseTemplate;
		responseTemplate = await this.getEmailServiceNotificationTemplateByType(serviceId, emailTemplateType);
		if (!responseTemplate) {
			responseTemplate = new ServiceNotificationTemplate();
			responseTemplate.id = null;
			responseTemplate.emailTemplateType = emailTemplateType;
			responseTemplate.htmlTemplate = this.notificationsRepository.getDefaultEmailNotificationTemplateByType(
				emailTemplateType,
			);
		}
		return responseTemplate;
	}

	public async getEmailServiceNotificationTemplateByType(
		serviceId: number,
		emailTemplateType: EmailNotificationTemplateType,
	): Promise<ServiceNotificationTemplate> {
		const templateData = await this.notificationTemplateRepository.getServiceTemplate(serviceId, emailTemplateType);
		return templateData;
	}

	public async addEmailServiceNotificationTemplateByType(
		serviceId: number,
		request: ServiceNotificationTemplateRequest,
	): Promise<ServiceNotificationTemplate> {
		const service = await this.servicesService.getService(serviceId);
		await this.verifyActionPermission(service, CrudAction.Create);

		if (!request || !request.emailTemplateType) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Invalid request`);
		}
		const emailTemplateType = request.emailTemplateType;
		const existTemplate = await this.notificationTemplateRepository.getServiceTemplate(
			serviceId,
			emailTemplateType,
		);
		if (existTemplate) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`Template of type ${EmailNotificationTemplateType[
					request.emailTemplateType
				].toString()} already exists`,
			);
		}
		const emailNotification = ServiceNotificationTemplate.create(
			request.htmlTemplate,
			serviceId,
			request.emailTemplateType,
		);
		return await this.notificationTemplateRepository.save(emailNotification);
	}

	public async updateEmailServiceNotificationTemplateByType(
		serviceId: number,
		request: ServiceNotificationTemplateRequest,
	): Promise<ServiceNotificationTemplate> {
		const service = await this.servicesService.getService(serviceId);
		await this.verifyActionPermission(service, CrudAction.Update);

		if (!request || !request.emailTemplateType) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Invalid request`);
		}
		const emailTemplateType = request.emailTemplateType;
		const templateEntity = await this.notificationTemplateRepository.getServiceTemplate(
			serviceId,
			emailTemplateType,
		);
		if (!templateEntity) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(
				`Template of type ${EmailNotificationTemplateType[request.emailTemplateType].toString()} not found`,
			);
		}

		templateEntity.htmlTemplate = request.htmlTemplate;
		return await this.notificationTemplateRepository.save(templateEntity);
	}
}
