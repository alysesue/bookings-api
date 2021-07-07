import { InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { ServiceNotificationTemplate } from '../../models';
import { EmailNotificationTemplateType } from '../../models/notifications';
import { SelectQueryBuilder } from 'typeorm';
import { andWhere } from '../../tools/queryConditions';

@InRequestScope
export class NotificationTemplateRepository extends RepositoryBase<ServiceNotificationTemplate> {
	constructor() {
		super(ServiceNotificationTemplate);
	}

	public async save(data: ServiceNotificationTemplate): Promise<ServiceNotificationTemplate> {
		const repository = await this.getRepository();
		return repository.save(data);
	}

	public async getTemplate(
		serviceId: number,
		emailTemplateType: EmailNotificationTemplateType,
	): Promise<ServiceNotificationTemplate> {
		const serviceIdCondition = 'service_notification_template._emailTemplateType = :enum';
		const query = await this.createSelectQuery([serviceIdCondition], { enum: emailTemplateType });
		const entry = await query.getOne();

		return entry;
	}

	private async createSelectQuery(
		queryFilters: string[],
		queryParams: {},
	): Promise<SelectQueryBuilder<ServiceNotificationTemplate>> {
		const repository = await this.getRepository();
		return repository
			.createQueryBuilder('service_notification_template')
			.where(andWhere([...queryFilters]), { ...queryParams });
	}
}
