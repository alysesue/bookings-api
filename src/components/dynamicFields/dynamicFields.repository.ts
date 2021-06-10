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

	public async save(entity: DynamicField): Promise<DynamicField> {
		const manager = await this.getEntityManager();
		// use entity manager, not repository, to save the inheritance tree
		return await manager.save(entity);
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

	public async get(options: { id: number; skipAuthorisation?: boolean }): Promise<DynamicField> {
		const { id } = options;
		const fieldCondition = 'field."_id" = :id';
		const query = await this.createSelectQuery([fieldCondition], { id }, options);

		return await query.getOne();
	}

	public async delete(field: DynamicField): Promise<void> {
		const repository = await this.getRepository();
		// Dynamic values are stored in JSON, so we soft delete the dynamic field metadata just in case it's being used.
		await repository.softDelete(field.id);
	}
}
