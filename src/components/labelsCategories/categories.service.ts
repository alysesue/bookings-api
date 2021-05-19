import { Inject, InRequestScope } from 'typescript-ioc';
import { Category, Label, Service } from '../../models';
import { CategoriesRepository } from "./categories.repository";
import { LabelsService } from "../labels/labels.service";

@InRequestScope
export class CategoriesService {
	@Inject
	private categoriesRepository: CategoriesRepository;
	@Inject
	private labelsService: LabelsService;

	public async delete(categories: Category[]) {
		await this.categoriesRepository.delete(categories);
	}

	public async update(service: Service, updatedCategories: Category[], updatedLabel: Label[]): Promise<Category[]> {
		const {newCategories, updateOrKeepCategories, deleteCategories} = this.sortUpdateCategories(service.categories, updatedCategories);
		const allLabelsOfDeleteCategories = [...(deleteCategories.map(cat => (cat.labels)))].flat(1);
		const {movedLabelsToNoCategory, deleteLabels} = this.labelsService.sortLabelForDeleteCategory(updatedLabel, allLabelsOfDeleteCategories)
		service.labels = await this.labelsService.updateLabelToNoCategory(movedLabelsToNoCategory, service)
		await this.labelsService.delete(deleteLabels)
		await this.delete(deleteCategories);
		return await this.categoriesRepository.save([...newCategories, ...updateOrKeepCategories])
	}

	public sortUpdateCategories(originalList: Category[], updatedList: Category[]): {newCategories: Category[], updateOrKeepCategories: Category[], deleteCategories: Category[]} {
		const newCategories = updatedList.filter(category => !category.id)
		const updateOrKeepCategories = updatedList.filter(category => (originalList.some(origCatego => origCatego.id === category.id)))
		const deleteCategories = originalList.filter(category => (!updatedList.some(origCatego => origCatego.id === category.id)))
		return {newCategories, updateOrKeepCategories, deleteCategories}
	}

}
