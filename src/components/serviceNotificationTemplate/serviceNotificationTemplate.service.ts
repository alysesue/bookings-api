import { Inject, InRequestScope } from 'typescript-ioc';
import { Service, ServiceNotificationTemplate } from '../../models';
import { ServiceNotificationTemplateRequest } from '../serviceNotificationTemplate/serviceNotificationTemplate.apicontract';
import { ServiceNotificationTemplateRepository } from '../serviceNotificationTemplate/serviceNotificationTemplate.repository';
import { EmailNotificationTemplateType } from '../../models/notifications';
import { UserContext } from '../../infrastructure/auth/userContext';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { CrudAction } from '../../enums/crudAction';
import { ServicesService } from '../services/services.service';
import { NotificationTemplateActionAuthVisitor } from './serviceNotificationTemplate.auth';

@InRequestScope
export class ServiceNotificationTemplateService {
	@Inject
	private notificationTemplateRepository: ServiceNotificationTemplateRepository;
	@Inject
	public servicesService: ServicesService;
	@Inject
	private userContext: UserContext;

	private async verifyActionPermission(service: Service, action: CrudAction): Promise<void> {
		const authGroups = await this.userContext.getAuthGroups();
		if (!new NotificationTemplateActionAuthVisitor(service, action).hasPermission(authGroups)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
				`User cannot perform this action (${action}) for service notification template.`,
			);
		}
	}

	public async getEmailNotificationTemplate(
		serviceId: number,
		emailTemplateType: EmailNotificationTemplateType,
	): Promise<ServiceNotificationTemplate> {
		const service = await this.servicesService.getService(serviceId);
		await this.verifyActionPermission(service, CrudAction.Read);

		if (!emailTemplateType) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Invalid request`);
		}
		return await this.getNotificationTemplate(serviceId, emailTemplateType);
	}

	private async getNotificationTemplate(
		serviceId: number,
		emailTemplateType: EmailNotificationTemplateType,
	): Promise<ServiceNotificationTemplate> {
		const templateData = await this.notificationTemplateRepository.getTemplateByType(serviceId, emailTemplateType);
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
		const service = await this.servicesService.getService(serviceId);
		await this.verifyActionPermission(service, CrudAction.Create);

		if (!request || !request.emailTemplateType) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Invalid request`);
		}
		const emailTemplateType = request.emailTemplateType;
		const existTemplate = await this.notificationTemplateRepository.getTemplateByType(serviceId, emailTemplateType);
		if (existTemplate) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_GENERIC).setMessage(
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

	public async updateEmailTemplate(
		serviceId: number,
		request: ServiceNotificationTemplateRequest,
	): Promise<ServiceNotificationTemplate> {
		const service = await this.servicesService.getService(serviceId);
		await this.verifyActionPermission(service, CrudAction.Update);

		if (!request || !request.emailTemplateType) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Invalid request`);
		}
		const emailTemplateType = request.emailTemplateType;
		const templateEntity = await this.notificationTemplateRepository.getTemplateByType(
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
