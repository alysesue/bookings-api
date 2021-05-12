import { Inject, InRequestScope } from 'typescript-ioc';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { Category } from '../../models/entities';
import { groupByKeyLastValue } from '../../tools/collections';
import { IdHasher } from '../../infrastructure/idHasher';
import { CategoriesRepository } from './categories.repository';

@InRequestScope
export class CategoriesService {
	@Inject
	private categoriesRepository: CategoriesRepository;
	@Inject
	private idHasher: IdHasher;

	public async verifyCategories(encodedCategoryIds: string[], serviceId: number): Promise<Category[]> {
		if (!encodedCategoryIds || encodedCategoryIds.length === 0) {
			return [];
		}

		const categoryIds = new Set<number>(encodedCategoryIds.map((encodedId) => this.idHasher.decode(encodedId)));

		const categoriesService = await this.categoriesRepository.find({ serviceId });
		const categoriesLookup = groupByKeyLastValue(categoriesService, (category) => category.id);

		const categoriesFound: Category[] = [];
		categoryIds.forEach((categoryId: number) => {
			const categoryFound = categoriesLookup.get(categoryId);
			if (!categoryFound) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
					`Invalid category id: ${this.idHasher.encode(categoryId)}`,
				);
			}
			categoriesFound.push(categoryFound);
		});
		return categoriesFound;
	}
}
