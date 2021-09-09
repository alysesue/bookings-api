import { RepositoryBase } from '../../core/repository';
import { ServiceProviderLabel, ServiceProviderLabelCategory, Organisation } from '../../models';
import { groupByKey } from '../../tools/collections';
import { andWhere } from '../../tools/queryConditions';
import { Inject, InRequestScope } from 'typescript-ioc';
import { SelectQueryBuilder } from 'typeorm';

@InRequestScope
export class ServiceProviderLabelsRepository extends RepositoryBase<ServiceProviderLabel> {
	constructor() {
		super(ServiceProviderLabel);
	}

	public async delete(data: ServiceProviderLabel[]) {
		const repository = await this.getRepository();
		if (!data.length) return;
		await repository.delete(data.map((label) => label.id));
	}

	public async save(data: ServiceProviderLabel[]): Promise<ServiceProviderLabel[]> {
		const repository = await this.getRepository();
		return repository.save(data);
	}

	public async find(options: {
		organisationIds?: number[];
		categoryIds?: number[];
		skipAuthorisation?: boolean;
	}): Promise<ServiceProviderLabel[]> {
		const { organisationIds, categoryIds } = options;

		const repository = await this.getRepository();
		const serviceCondition = organisationIds?.length ? 'label."_organisationId" IN (:...organisationIds) ' : '';
		const categoryCondition = categoryIds?.length ? 'label."_categoryId" IN  (:...categoryIds) ' : '';

		return repository
			.createQueryBuilder('label')
			.where(andWhere([serviceCondition, categoryCondition]), {
				organisationIds,
				categoryIds,
			})
			.leftJoin('label.organisation', 'serviceproviderlabel')
			.leftJoin('label.category', 'categorylabel')
			.getMany();
	}

	public async populateLabelForCategories<T extends ServiceProviderLabelCategory>(entries: T[]): Promise<T[]> {
		const ids = entries.map((s) => {
			return s.id;
		});
		const listLabels = await this.find({ categoryIds: ids, skipAuthorisation: true });
		const lookupTable = groupByKey(listLabels, (b) => b.categoryId);
		entries.forEach((entry) => (entry.labels = lookupTable.get(entry.id) || []));

		return entries;
	}

	public async populateLabelForOrganisation<T extends Organisation>(entries: T[]): Promise<T[]> {
		const ids = entries.map((s) => {
			return s.id;
		});
		const listLabels = await this.find({ organisationIds: ids });
		const lookupTable = groupByKey(listLabels, (b) => b.organisationId);
		entries.forEach((entry) => (entry.labels = lookupTable.get(entry.id) || []));

		return entries;
	}
}

@InRequestScope
export class ServiceProviderLabelsCategoriesRepository extends RepositoryBase<ServiceProviderLabelCategory> {
	@Inject
	private serviceProviderLabelsRepository: ServiceProviderLabelsRepository;

	constructor() {
		super(ServiceProviderLabelCategory);
	}

	private async createSelectQuery(
		queryFilters: string[],
		queryParams: {},
	): Promise<SelectQueryBuilder<ServiceProviderLabelCategory>> {
		const repository = await this.getRepository();
		return repository.createQueryBuilder('cat').where(andWhere([...queryFilters]), { ...queryParams });
	}

	public async delete(data: ServiceProviderLabelCategory[]) {
		if (!data.length) return;
		const repository = await this.getRepository();
		await repository.delete(data.map((category) => category.id));
	}

	public async save(data: ServiceProviderLabelCategory[]): Promise<ServiceProviderLabelCategory[]> {
		const repository = await this.getRepository();
		return repository.save(data);
	}

	public async find(options: { organisationId: number }): Promise<ServiceProviderLabelCategory[]> {
		const { organisationId } = options;
		const serviceProviderIdCondition = 'cat."_organisationId" = :organisationId';
		const query = await this.createSelectQuery([serviceProviderIdCondition], { organisationId });
		const categories = await query.getMany();
		return await this.serviceProviderLabelsRepository.populateLabelForCategories(categories);
	}

	public async populateCategories<T extends Organisation>(entries: T[]): Promise<T[]> {
		return Promise.all(
			entries.map(async (s) => {
				s.categories = await this.find({ organisationId: s.id });
				return s;
			}),
		);
	}
}
