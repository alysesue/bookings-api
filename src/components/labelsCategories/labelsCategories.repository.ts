import { InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { LabelCategory } from '../../models/entities';

@InRequestScope
export class LabelsCategoriesRepository extends RepositoryBase<LabelCategory> {
	// @Inject
	// private userContext: UserContext;

	constructor() {
		super(LabelCategory);
	}

	public async delete(data: LabelCategory[]) {
		if (!data.length) return;
		const repository = await this.getRepository();
		await repository.delete(data.map((category) => category.id));
	}

	public async save(data: LabelCategory[]): Promise<LabelCategory[]> {
		const repository = await this.getRepository();
		return repository.save(data);
	}
	//
	// public async find(options: { serviceId: number; skipAuthorisation?: boolean }): Promise<LabelCategory[]> {
	// 	const { serviceId } = options;
	// 	const authGroups = await this.userContext.getAuthGroups();
	//
	// 	const { userCondition, userParams } = options.skipAuthorisation
	// 		? { userCondition: '', userParams: {} }
	// 		: await new ServicesQueryAuthVisitor('servicecategory').createUserVisibilityCondition(authGroups);
	//
	// 	const repository = await this.getRepository();
	// 	const serviceCondition = 'category."_serviceId" = :serviceId';
	//
	// 	return repository
	// 		.createQueryBuilder('category')
	// 		.where(andWhere([serviceCondition, userCondition]), { serviceId, ...userParams })
	// 		.leftJoin('category.service', 'servicecategory')
	// 		.getMany();
	// }
}
