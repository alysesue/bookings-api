import { Inject, InRequestScope } from 'typescript-ioc';
import { Category } from '../../models/entities';
import { IdHasher } from '../../infrastructure/idHasher';
import { CategoryRequestModel, CategoryResponseModel } from './categories.apicontract';
import { LabelsMapper } from "../labels/labels.mapper";

@InRequestScope
export class CategoriesMapper {
	@Inject
	private idHasher: IdHasher;
	@Inject
	private labelsMapper: LabelsMapper;

	public mapToCategoriesResponse(data: Category[] = []): CategoryResponseModel[] {
		return data.map((i) => {
			const categoryData = new CategoryResponseModel();
			categoryData.id = this.idHasher.encode(i.id);
			categoryData.categoryName = i.categoryName;
			categoryData.labels = this.labelsMapper.mapToLabelsResponse(i.labels);
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
			entity.labels = this.labelsMapper.mapToLabels(i.labels);
			return entity;
		});
	}

}
