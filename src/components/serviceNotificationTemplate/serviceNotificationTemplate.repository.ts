import { Inject, InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { ServiceNotificationTemplate } from '../../models';
import { EmailNotificationTemplateType } from '../notifications/notifications.enum';
import { SelectQueryBuilder } from 'typeorm';
import { UserContext } from '../../infrastructure/auth/userContext';
import { NotificationTemplateQueryAuthVisitor } from './serviceNotificationTemplate.auth';
import { andWhere } from '../../tools/queryConditions';

@InRequestScope
export class ServiceNotificationTemplateRepository extends RepositoryBase<ServiceNotificationTemplate> {
	@Inject
	private userContext: UserContext;

	constructor() {
		super(ServiceNotificationTemplate);
	}

	public async save(data: ServiceNotificationTemplate): Promise<ServiceNotificationTemplate> {
		const repository = await this.getRepository();
		return repository.save(data);
	}

	public async getServiceTemplate(
		serviceId: number,
		emailTemplateType: EmailNotificationTemplateType,
	): Promise<ServiceNotificationTemplate> {
		const serviceCondition = 'service_notification_template._serviceId = :serviceId';
		const emailTemplateTypeCondition = 'service_notification_template._emailTemplateType = :enum';
		const query = await this.createSelectQuery([serviceCondition, emailTemplateTypeCondition], {
			serviceId,
			enum: emailTemplateType,
		});
		const entry = await query.getOne();

		return entry;
	}

	private async createSelectQuery(
		queryFilters: string[],
		queryParams: {},
	): Promise<SelectQueryBuilder<ServiceNotificationTemplate>> {
		const authGroups = await this.userContext.getAuthGroups();
		await new NotificationTemplateQueryAuthVisitor(
			'service_notification_template',
			'service',
		).createUserVisibilityCondition(authGroups);

		const repository = await this.getRepository();
		return repository
			.createQueryBuilder('service_notification_template')
			.where(andWhere([...queryFilters]), { ...queryParams });
	}
}
