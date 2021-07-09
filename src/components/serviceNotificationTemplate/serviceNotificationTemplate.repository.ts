import { InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
// import { UserContext } from '../../infrastructure/auth/userContext';
import { ServiceNotificationTemplate } from '../../models';
import { EmailNotificationTemplateType } from '../../models/notifications';
import { SelectQueryBuilder } from 'typeorm';
import { andWhere } from '../../tools/queryConditions';
// import { ServicesQueryAuthVisitor } from '../services/services.auth';

@InRequestScope
export class ServiceNotificationTemplateRepository extends RepositoryBase<ServiceNotificationTemplate> {
	// @Inject
	// private userContext: UserContext;

	constructor() {
		super(ServiceNotificationTemplate);
	}

	public async save(data: ServiceNotificationTemplate): Promise<ServiceNotificationTemplate> {
		const repository = await this.getRepository();
		return repository.save(data);
	}

	public async getTemplateByType(
		serviceId: number,
		emailTemplateType: EmailNotificationTemplateType,
		options?: {
			skipAuthorisation?: boolean;
		},
	): Promise<ServiceNotificationTemplate> {
		const serviceIdCondition = 'service_notification_template._emailTemplateType = :enum';
		const query = await this.createSelectQuery([serviceIdCondition], { enum: emailTemplateType }, options);
		const entry = await query.getOne();

		return entry;
	}

	private async createSelectQuery(
		queryFilters: string[],
		queryParams: {},
		options?: {
			skipAuthorisation?: boolean;
		},
	): Promise<SelectQueryBuilder<ServiceNotificationTemplate>> {
		if (options.skipAuthorisation){} //WIP
		// const authGroups = await this.userContext.getAuthGroups();
		// const { userCondition, userParams } = options.skipAuthorisation
		// 	? { userCondition: '', userParams: {} }
		// 	: await new ServicesQueryAuthVisitor('').createUserVisibilityCondition(authGroups);

		const repository = await this.getRepository();
		return (
			repository
				.createQueryBuilder('service_notification_template')
				// .where(andWhere([userCondition, ...queryFilters]), { ...userParams, ...queryParams });
				.where(andWhere([...queryFilters]), { ...queryParams })
		);
	}
}
