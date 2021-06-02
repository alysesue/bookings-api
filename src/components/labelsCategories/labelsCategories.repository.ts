import { Inject, InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { LabelCategory, Service } from '../../models/entities';
import { SelectQueryBuilder } from 'typeorm';
import { andWhere } from '../../tools/queryConditions';
import { LabelsRepository } from '../labels/labels.repository';

@InRequestScope
export class LabelsCategoriesRepository extends RepositoryBase<LabelCategory> {
	@Inject
	private labelsRepository: LabelsRepository;

	constructor() {
		super(LabelCategory);
	}

	private async createSelectQuery(
		queryFilters: string[],
		queryParams: {},
	): Promise<SelectQueryBuilder<LabelCategory>> {
		const repository = await this.getRepository();
		return repository.createQueryBuilder('cat').where(andWhere([...queryFilters]), { ...queryParams });
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

	public async find(options: { serviceId: number }): Promise<LabelCategory[]> {
		const { serviceId } = options;
		const serviceIdCondition = 'cat."_serviceId" = :serviceId';
		const query = await this.createSelectQuery([serviceIdCondition], { serviceId });
		const categories = await query.getMany();
		return await this.labelsRepository.populateLabelForCategories(categories);
	}

	public async populateCategories<T extends Service>(entries: T[]): Promise<T[]> {
		return Promise.all(
			entries.map(async (s) => {
				s.categories = await this.find({ serviceId: s.id });
				return s;
			}),
		);
	}
}
