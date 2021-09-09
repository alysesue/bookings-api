import { Inject, InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { Label, LabelCategory, Service } from '../../models/entities';
import { UserContext } from '../../infrastructure/auth/userContext';
import { andWhere } from '../../tools/queryConditions';
import { ServicesQueryAuthVisitor } from '../services/services.auth';
import { groupByKey } from '../../tools/collections';
// import { OrganisationsQueryAuthVisitor } from '../organisations/organisations.auth';

@InRequestScope
export class LabelsRepository extends RepositoryBase<Label> {
	@Inject
	private userContext: UserContext;

	constructor() {
		super(Label);
	}

	public async delete(data: Label[]) {
		const repository = await this.getRepository();
		if (!data.length) return;
		await repository.delete(data.map((label) => label.id));
	}

	public async save(data: Label[]): Promise<Label[]> {
		const repository = await this.getRepository();
		return repository.save(data);
	}

	public async find(options: {
		serviceIds?: number[];
		categoryIds?: number[];
		skipAuthorisation?: boolean;
	}): Promise<Label[]> {
		const { serviceIds, categoryIds } = options;
		const authGroups = await this.userContext.getAuthGroups();

		const { userCondition, userParams } = options.skipAuthorisation
			? { userCondition: '', userParams: {} }
			: await new ServicesQueryAuthVisitor('servicelabel').createUserVisibilityCondition(authGroups);

		const repository = await this.getRepository();
		const serviceCondition = serviceIds?.length ? 'label."_serviceId" IN (:...serviceIds) ' : '';
		const categoryCondition = categoryIds?.length ? 'label."_categoryId" IN  (:...categoryIds) ' : '';

		return repository
			.createQueryBuilder('label')
			.where(andWhere([serviceCondition, categoryCondition, userCondition]), {
				serviceIds,
				categoryIds,
				...userParams,
			})
			.leftJoin('label.service', 'servicelabel')
			.leftJoin('label.category', 'categorylabel')
			.getMany();
	}

	public async populateLabelForCategories<T extends LabelCategory>(entries: T[]): Promise<T[]> {
		const ids = entries.map((s) => {
			return s.id;
		});
		const listLabels = await this.find({ categoryIds: ids, skipAuthorisation: true });
		const lookupTable = groupByKey(listLabels, (b) => b.categoryId);
		entries.forEach((entry) => (entry.labels = lookupTable.get(entry.id) || []));

		return entries;
	}

	public async populateLabelForService<T extends Service>(entries: T[]): Promise<T[]> {
		const ids = entries.map((s) => {
			return s.id;
		});
		const listLabels = await this.find({ serviceIds: ids });
		const lookupTable = groupByKey(listLabels, (b) => b.serviceId);
		entries.forEach((entry) => (entry.labels = lookupTable.get(entry.id) || []));

		return entries;
	}
}
