import { LabelsCategoriesService } from "../labelsCategories.service";
import { LabelCategory } from "../../../models";

export class LabelsCategoriesServiceMock implements Partial<LabelsCategoriesService> {

	public static deleteMock = jest.fn();
	public static updateMock = jest.fn();
	public static sortUpdateCategoriesMock = jest.fn();

	public async delete(categories: LabelCategory[]) {
		return await LabelsCategoriesServiceMock.deleteMock(categories);
	}

	public async update(...params): Promise<LabelCategory[]> {
		return await LabelsCategoriesServiceMock.updateMock(...params);
	}

	public sortUpdateCategories(...params): { newCategories: LabelCategory[], updateOrKeepCategories: LabelCategory[], deleteCategories: LabelCategory[] } {
		return LabelsCategoriesServiceMock.sortUpdateCategoriesMock(...params);
	}
}