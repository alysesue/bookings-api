import { Organisation, ServiceProviderLabel, ServiceProviderLabelCategory } from '../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import {
	ServiceProviderLabelsCategoriesRepository,
	ServiceProviderLabelsRepository,
} from './serviceProvidersLabels.repository';

@InRequestScope
export class SPLabelsCategoriesService {
	@Inject
	private serviceProviderLabelRepository: ServiceProviderLabelsRepository;
	@Inject
	private spCategoriesRepository: ServiceProviderLabelsCategoriesRepository;

	public sortSPLabelForDeleteCategory(
		labelsNoCategory: ServiceProviderLabel[],
		labelsCategory: ServiceProviderLabel[],
	): { movedLabelsToNoCategory: ServiceProviderLabel[]; deleteLabels: ServiceProviderLabel[] } {
		const movedLabelsToNoCategory = labelsCategory.filter((labelCat) =>
			labelsNoCategory.some((labelNoCat: ServiceProviderLabel) => labelCat.id === labelNoCat.id),
		);
		const deleteLabels = labelsCategory.filter(
			(labelCat: ServiceProviderLabel) =>
				!labelsNoCategory.some((labelNoCat: ServiceProviderLabel) => labelCat.id === labelNoCat.id),
		);

		return { movedLabelsToNoCategory, deleteLabels };
	}

	public async updateSPLabelToNoCategory(
		labels: ServiceProviderLabel[],
		organisation: Organisation,
	): Promise<ServiceProviderLabel[]> {
		labels.forEach((label) => {
			label.categoryId = null;
			label.organisationId = organisation.id;
		});
		const updateLabel = await this.serviceProviderLabelRepository.save(labels as ServiceProviderLabel[]);

		return [...organisation.labels, ...updateLabel];
	}

	public async updateSPLabel(
		organisation: Organisation,
		updatedCategories: ServiceProviderLabelCategory[],
		updatedLabel: ServiceProviderLabel[],
	): Promise<ServiceProviderLabelCategory[]> {
		const { newCategories, updateOrKeepCategories, deleteCategories } = this.sortUpdateSPCategories(
			organisation.categories,
			updatedCategories,
			organisation.id,
		);

		const allLabelsOfDeleteCategories = [...deleteCategories.map((cat) => cat.labels)].flat(1);
		const { movedLabelsToNoCategory, deleteLabels } = this.sortSPLabelForDeleteCategory(
			updatedLabel,
			allLabelsOfDeleteCategories,
		);
		organisation.labels = await this.updateSPLabelToNoCategory(movedLabelsToNoCategory, organisation);

		await this.serviceProviderLabelRepository.delete(deleteLabels);
		await this.spCategoriesRepository.delete(deleteCategories);
		return await this.spCategoriesRepository.save([...newCategories, ...updateOrKeepCategories]);
	}

	private sortUpdateSPCategories(
		originalList: ServiceProviderLabelCategory[],
		updatedList: ServiceProviderLabelCategory[],
		organisationId: number,
	): {
		newCategories: ServiceProviderLabelCategory[];
		updateOrKeepCategories: ServiceProviderLabelCategory[];
		deleteCategories: ServiceProviderLabelCategory[];
	} {
		const newCategories = updatedList
			.filter((category) => !category.id)
			.map((category) => {
				category.organisationId = organisationId;
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
