import { Inject, InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { UserContext } from '../../infrastructure/auth/userContext';
import { SelectQueryBuilder } from 'typeorm';
import { andWhere } from '../../tools/queryConditions';
import { DynamicField } from '../../models';
import { ServicesQueryAuthVisitor } from '../services/services.auth';

@InRequestScope
export class DynamicFieldsRepository extends RepositoryBase<DynamicField> {
	@Inject
	private userContext: UserContext;

	constructor() {
		super(DynamicField);
	}

	private async createSelectQuery(
		queryFilters: string[],
		queryParams: {},
		options: {
			skipAuthorisation?: boolean;
		},
	): Promise<SelectQueryBuilder<DynamicField>> {
		const authGroups = await this.userContext.getAuthGroups();
		const { userCondition, userParams } = options.skipAuthorisation
			? { userCondition: '', userParams: {} }
			: await new ServicesQueryAuthVisitor('svc').createUserVisibilityCondition(authGroups);

		const repository = await this.getRepository();
		return repository
			.createQueryBuilder('field')
			.where(andWhere([userCondition, ...queryFilters]), { ...userParams, ...queryParams })
			.leftJoin('field._service', 'svc');
	}

	public async getServiceFields(options: {
		serviceId: number;
		skipAuthorisation?: boolean;
	}): Promise<DynamicField[]> {
		const { serviceId } = options;
		const serviceCondition = 'field."_serviceId" = :serviceId';
		const query = await this.createSelectQuery([serviceCondition], { serviceId }, options);

		return await query.getMany();
	}
}
