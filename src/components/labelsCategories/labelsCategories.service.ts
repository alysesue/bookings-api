import { Inject, InRequestScope } from 'typescript-ioc';
import { LabelCategory, Label, Service, ServiceProviderLabelCategory } from '../../models';
import { LabelsCategoriesRepository } from './labelsCategories.repository';
import { LabelsService } from '../labels/labels.service';
import { LabelResponse } from '../labels/label.enum';
import { ServiceProviderLabelsCategoriesRepository } from '../serviceProvidersLabels/serviceProvidersLabels.repository';

@InRequestScope
export class LabelsCategoriesService {
	@Inject
	private categoriesRepository: LabelsCategoriesRepository;
	@Inject
	private labelsService: LabelsService;
	@Inject
	private spCategoriesRepository: ServiceProviderLabelsCategoriesRepository;

	public async save(
		categories: LabelCategory[] | ServiceProviderLabelCategory[],
		response: LabelResponse = LabelResponse.SERVICE,
	): Promise<LabelCategory[] | ServiceProviderLabelCategory[]> {
		if (!categories.length) return;
		switch (response) {
			case LabelResponse.SERVICE:
				return await this.categoriesRepository.save(categories as LabelCategory[]);
			case LabelResponse.SERVICE_PROVIDER:
				return await this.spCategoriesRepository.save(categories as ServiceProviderLabelCategory[]);
		}
	}

	public async delete(
		categories: LabelCategory[] | ServiceProviderLabelCategory[],
		response: LabelResponse = LabelResponse.SERVICE,
	): Promise<void> {
		if (!categories.length) return;
		switch (response) {
			case LabelResponse.SERVICE:
				return await this.categoriesRepository.delete(categories as LabelCategory[]);
			case LabelResponse.SERVICE_PROVIDER:
				return await this.spCategoriesRepository.delete(categories as ServiceProviderLabelCategory[]);
		}
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
		return (await this.save([...newCategories, ...updateOrKeepCategories])) as LabelCategory[];
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
