import { Container } from "typescript-ioc";
import { LabelsCategoriesService } from "../labelsCategories.service";
import { LabelCategory, Label } from "../../../models";

describe('Test categoriesLabels service', () => {
	beforeAll(() => {
		jest.resetAllMocks();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('Should add category and delete missing one', async () => {
		const label1 = Label.create('Label1', 1)
		const label2 = Label.create('Label2', 2)
		const catego1 = LabelCategory.create('catego1', [label1], 1);
		const catego2 = LabelCategory.create('catego2', [label2]);
		const originalCategories = [catego1] as LabelCategory[]
		const updateCategories = [catego2] as LabelCategory[]
		const updateListOfCategories = await Container.get(LabelsCategoriesService).sortUpdateCategories(originalCategories, updateCategories, 1);

		expect(updateListOfCategories.newCategories).toStrictEqual([catego2]);
		expect(updateListOfCategories.updateOrKeepCategories).toStrictEqual([]);
		expect(updateListOfCategories.deleteCategories).toStrictEqual([catego1]);
	});

	it('Should update category when modify it', async () => {
		const label1 = Label.create('Label1', 1)
		const label2 = Label.create('Label2', 2)
		const catego1 = LabelCategory.create('catego1', [label1], 1);
		const catego2 = LabelCategory.create('catego2', [label2], 1);
		const originalCategories = [catego1] as LabelCategory[]
		const updateCategories = [catego2] as LabelCategory[]
		const updateListOfCategories = await Container.get(LabelsCategoriesService).sortUpdateCategories(originalCategories, updateCategories, 1);
		expect(updateListOfCategories.newCategories).toStrictEqual([]);
		expect(updateListOfCategories.updateOrKeepCategories).toStrictEqual([catego2]);
		expect(updateListOfCategories.deleteCategories).toStrictEqual([]);
	});
})