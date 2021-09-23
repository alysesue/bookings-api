import { Organisation, ServiceProviderLabel, ServiceProviderLabelCategory } from '../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import { LabelsService } from '../labels/labels.service';
import { LabelResponse } from '../labels/label.enum';
import { LabelsCategoriesService } from '../labelsCategories/labelsCategories.service';

@InRequestScope
export class SPLabelsCategoriesService {
	@Inject
	private labelsService: LabelsService;
	@Inject
	private labelsCategoriesService: LabelsCategoriesService;

	public sortSPLabelForDeleteCategory(
		labelsNoCategory: ServiceProviderLabel[],
		labelsCategory: ServiceProviderLabel[],
	): { movedLabelsToNoCategory: ServiceProviderLabel[]; deleteLabels: ServiceProviderLabel[] } {
		return this.labelsService.genericSortLabelForDeleteCategory(labelsNoCategory, labelsCategory) as {
			movedLabelsToNoCategory: ServiceProviderLabel[];
			deleteLabels: ServiceProviderLabel[];
		};
	}

	public async updateSPLabelToNoCategory(
		labels: ServiceProviderLabel[],
		organisation: Organisation,
	): Promise<ServiceProviderLabel[]> {
		labels.forEach((label) => {
			label.categoryId = null;
			label.organisationId = organisation.id;
		});

		const updateLabel = (await this.labelsService.update(
			labels,
			LabelResponse.SERVICE_PROVIDER,
		)) as ServiceProviderLabel[];
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
		await this.labelsService.delete(deleteLabels, LabelResponse.SERVICE_PROVIDER);
		await this.labelsCategoriesService.delete(deleteCategories, LabelResponse.SERVICE_PROVIDER);
		return (await this.labelsCategoriesService.save(
			[...newCategories, ...updateOrKeepCategories],
			LabelResponse.SERVICE_PROVIDER,
		)) as ServiceProviderLabelCategory[];
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
