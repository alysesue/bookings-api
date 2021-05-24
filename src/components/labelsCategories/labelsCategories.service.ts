import { Inject, InRequestScope } from 'typescript-ioc';
import { LabelCategory, Label, Service } from '../../models';
import { LabelsCategoriesRepository } from './labelsCategories.repository';
import { LabelsService } from '../labels/labels.service';

@InRequestScope
export class LabelsCategoriesService {
	@Inject
	private categoriesRepository: LabelsCategoriesRepository;
	@Inject
	private labelsService: LabelsService;

	public async delete(categories: LabelCategory[]) {
		await this.categoriesRepository.delete(categories);
	}

	public async update(
		service: Service,
		updatedCategories: LabelCategory[],
		updatedLabel: Label[],
	): Promise<LabelCategory[]> {
		const { newCategories, updateOrKeepCategories, deleteCategories } = this.sortUpdateCategories(
			service.categories,
			updatedCategories,
			service.id,
		);
		const allLabelsOfDeleteCategories = [...deleteCategories.map((cat) => cat.labels)].flat(1);
		const { movedLabelsToNoCategory, deleteLabels } = this.labelsService.sortLabelForDeleteCategory(
			updatedLabel,
			allLabelsOfDeleteCategories,
		);
		service.labels = await this.labelsService.updateLabelToNoCategory(movedLabelsToNoCategory, service);
		await this.labelsService.delete(deleteLabels);
		await this.delete(deleteCategories);
		return [...newCategories, ...updateOrKeepCategories];
	}

	public sortUpdateCategories(
		originalList: LabelCategory[],
		updatedList: LabelCategory[],
		serviceId: number,
	): { newCategories: LabelCategory[]; updateOrKeepCategories: LabelCategory[]; deleteCategories: LabelCategory[] } {
		const newCategories = updatedList
			.filter((category) => !category.id)
			.map((category) => {
				category.serviceId = serviceId;
				return category;
			});
		const updateOrKeepCategories = updatedList.filter((category) =>
			originalList.some((origCatego) => origCatego.id === category.id),
		);
		const deleteCategories = originalList.filter(
			(category) => !updatedList.some((origCatego) => origCatego.id === category.id),
		);
		return { newCategories, updateOrKeepCategories, deleteCategories };
	}
}
