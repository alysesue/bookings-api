import { InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { LabelCategory } from '../../models/entities';

@InRequestScope
export class LabelsCategoriesRepository extends RepositoryBase<LabelCategory> {
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
}
