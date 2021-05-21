import { Inject, InRequestScope } from 'typescript-ioc';
import { LabelCategory } from '../../models/entities';
import { IdHasher } from '../../infrastructure/idHasher';
import { LabelCategoryRequestModel, LabelCategoryResponseModel } from './labelsCategories.apicontract';
import { LabelsMapper } from "../labels/labels.mapper";

@InRequestScope
export class LabelsCategoriesMapper {
	@Inject
	private idHasher: IdHasher;
	@Inject
	private labelsMapper: LabelsMapper;

	public mapToCategoriesResponse(data: LabelCategory[] = []): LabelCategoryResponseModel[] {
		return data.map((i) => {
			const categoryData = new LabelCategoryResponseModel();
			categoryData.id = this.idHasher.encode(i.id);
			categoryData.categoryName = i.name;
			categoryData.labels = this.labelsMapper.mapToLabelsResponse(i.labels);
			return categoryData;
		});
	}

	public mapToCategories(request: LabelCategoryRequestModel[] = []): LabelCategory[] {
		request = request.filter((v, i, a) => a.findIndex((t) => t.categoryName === v.categoryName) === i);
		return request.map((i) => {
			const entity = new LabelCategory();
			if (i.id) {
				entity.id = this.idHasher.decode(i.id);
			}
			entity.name = i.categoryName;
			entity.labels = this.labelsMapper.mapToLabels(i.labels);
			return entity;
		});
	}

}
