import { Inject, InRequestScope } from 'typescript-ioc';
import { Category } from '../../models/entities/category';
import { IdHasher } from '../../infrastructure/idHasher';
import { CategoryRequestModel, CategoryResponseModel } from './categories.apicontract';

@InRequestScope
export class CategoriesMapper {
	@Inject
	private idHasher: IdHasher;

	public mapToCategoriesResponse(data: Category[] = []): CategoryResponseModel[] {
		return data.map((i) => {
			const categoryData = new CategoryResponseModel();
			categoryData.id = this.idHasher.encode(i.id);
			categoryData.categoryName = i.categoryName;
			return categoryData;
		});
	}

	public mapToCategories(request: CategoryRequestModel[] = []): Category[] {
		request = request.filter((v, i, a) => a.findIndex((t) => t.categoryName === v.categoryName) === i);
		return request.map((i) => {
			const entity = new Category();
			if (i.id) {
				entity.id = this.idHasher.decode(i.id);
			}
			entity.categoryName = i.categoryName;
			return entity;
		});
	}

	public mergeCategories(originalList: Category[], updatedList: Category[]): Category[] {
		for (let index = 0; index < originalList.length; ) {
			const originalCategory = originalList[index];
			const foundUpdatedCategory = updatedList.find((l) => !!l.id && l.id === originalCategory.id);
			if (foundUpdatedCategory) {
				originalCategory.categoryName = foundUpdatedCategory.categoryName;
				index++;
			} else {
				originalList.splice(index, 1);
			}
		}

		originalList.push(...updatedList.filter((category) => !category.id));

		return originalList;
	}
}
