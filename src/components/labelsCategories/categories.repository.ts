import { Inject, InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { Category } from '../../models/entities';
import { UserContext } from '../../infrastructure/auth/userContext';
import { andWhere } from '../../tools/queryConditions';
import { ServicesQueryAuthVisitor } from '../services/services.auth';

@InRequestScope
export class CategoriesRepository extends RepositoryBase<Category> {
	@Inject
	private userContext: UserContext;

	constructor() {
		super(Category);
	}

	public async delete(data: Category[]) {
		const repository = await this.getRepository();

		await repository.delete(data.map((category) => category.id));
	}

	public async save(data: Category[]): Promise<Category[]> {
		const repository = await this.getRepository();
		return repository.save(data);
	}

	public async find(options: { serviceId: number; skipAuthorisation?: boolean }): Promise<Category[]> {
		const { serviceId } = options;
		const authGroups = await this.userContext.getAuthGroups();

		const { userCondition, userParams } = options.skipAuthorisation
			? { userCondition: '', userParams: {} }
			: await new ServicesQueryAuthVisitor('servicecategory').createUserVisibilityCondition(authGroups);

		const repository = await this.getRepository();
		const serviceCondition = 'category."_serviceId" = :serviceId';

		return repository
			.createQueryBuilder('category')
			.where(andWhere([serviceCondition, userCondition]), { serviceId, ...userParams })
			.leftJoin('category.service', 'servicecategory')
			.getMany();
	}
}
