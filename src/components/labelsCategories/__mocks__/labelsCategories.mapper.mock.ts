import { LabelCategory } from '../../../models';
import { LabelCategoryResponseModel } from '../labelsCategories.apicontract';
import { LabelsCategoriesMapper } from '../labelsCategories.mapper';

export class LabelsCategoriesMapperMock implements Partial<LabelsCategoriesMapper> {
	public static mapToCategoriesResponse = jest.fn<LabelCategoryResponseModel[], any>();
	public static mapToCategories = jest.fn<LabelCategory[], any>();

	public mapToCategoriesResponse(...param): LabelCategoryResponseModel[] {
		return LabelsCategoriesMapperMock.mapToCategoriesResponse(...param);
	}

	public mapToCategories(...param): LabelCategory[] {
		return LabelsCategoriesMapperMock.mapToCategories(...param);
	}
}
