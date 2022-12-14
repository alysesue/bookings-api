import { Inject, InRequestScope } from 'typescript-ioc';
import { Service, ServiceNotificationTemplate } from '../../models';
import { ServiceNotificationTemplateRequest } from '../serviceNotificationTemplate/serviceNotificationTemplate.apicontract';
import { ServiceNotificationTemplateRepository } from '../serviceNotificationTemplate/serviceNotificationTemplate.repository';
import { EmailNotificationTemplateType } from '../notifications/notifications.enum';
import { UserContext } from '../../infrastructure/auth/userContext';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { CrudAction } from '../../enums/crudAction';
import { ServicesService } from '../services/services.service';
import { NotificationTemplateActionAuthVisitor } from './serviceNotificationTemplate.auth';
import { NotificationsRepository } from '../notifications/notifications.repository';
import { cleanHtml } from './serviceNotificationTemplate.sanitizeHtml';

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

		let responseTemplate = await this.getEmailServiceNotificationTemplateByType(serviceId, emailTemplateType);

		if (!responseTemplate) {
			responseTemplate = this.createResponseDefaultTemplateByType(emailTemplateType);
		}
		return responseTemplate;
	}

	public async getEmailServiceNotificationTemplateByType(
		serviceId: number,
		emailTemplateType: EmailNotificationTemplateType,
	): Promise<ServiceNotificationTemplate> {
		if (!emailTemplateType) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Invalid request`);
		}
		return await this.notificationTemplateRepository.getServiceTemplate(serviceId, emailTemplateType);
	}

	public async addEmailServiceNotificationTemplateByType(
		serviceId: number,
		request: ServiceNotificationTemplateRequest,
	): Promise<ServiceNotificationTemplate> {
		const service = await this.servicesService.getService(serviceId);
		await this.verifyActionPermission(service, CrudAction.Create);
		const existTemplate = await this.getEmailServiceNotificationTemplateByType(
			serviceId,
			request.emailTemplateType,
		);

		if (existTemplate) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`Template of type ${EmailNotificationTemplateType[
					request.emailTemplateType
				].toString()} already exists`,
			);
		}
		const emailNotification = ServiceNotificationTemplate.create(
			cleanHtml(request.htmlTemplate),
			serviceId,
			request.emailTemplateType,
		);
		return await this.notificationTemplateRepository.save(emailNotification);
	}

	public async updateEmailServiceNotificationTemplate(
		serviceId: number,
		id: number,
		request: ServiceNotificationTemplateRequest,
	): Promise<ServiceNotificationTemplate> {
		const service = await this.servicesService.getService(serviceId);
		await this.verifyActionPermission(service, CrudAction.Update);
		const existTemplate = await this.getEmailServiceNotificationTemplateByType(
			serviceId,
			request.emailTemplateType,
		);

		if (!existTemplate || existTemplate.id !== id) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(
				`Template of type ${EmailNotificationTemplateType[
					request.emailTemplateType
				].toString()} not found or does not match the template id`,
			);
		}
		existTemplate.htmlTemplate = cleanHtml(request.htmlTemplate);
		return await this.notificationTemplateRepository.save(existTemplate);
	}

	public createResponseDefaultTemplateByType(
		emailTemplateType: EmailNotificationTemplateType,
	): ServiceNotificationTemplate {
		const defaultTemplate = new ServiceNotificationTemplate();
		defaultTemplate.id = null;
		defaultTemplate.emailTemplateType = emailTemplateType;
		defaultTemplate.htmlTemplate =
			this.notificationsRepository.getDefaultEmailNotificationTemplateByType(emailTemplateType);

		return defaultTemplate;
	}
}
