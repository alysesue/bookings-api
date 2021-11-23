import {Organisation, ServiceProvider, ServiceProviderLabel, ServiceProviderLabelCategory} from '../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import {
	ServiceProviderLabelsCategoriesRepository,
	ServiceProviderLabelsRepository,
} from './serviceProvidersLabels.repository';
import { MOLErrorV2, ErrorCodeV2 } from 'mol-lib-api-contract';
import { groupByKeyLastValue } from '../../tools/collections';
import { IdHasher } from '../../infrastructure/idHasher';

@InRequestScope
export class SPLabelsCategoriesService {
	@Inject
	private serviceProviderLabelRepository: ServiceProviderLabelsRepository;
	@Inject
	private spCategoriesRepository: ServiceProviderLabelsCategoriesRepository;
	@Inject
	private idHasher: IdHasher;

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

	public async verifySPLabels(
		encodedLabelIds: string[],
		organisation: Organisation,
	): Promise<ServiceProviderLabel[]> {
		if (!encodedLabelIds || encodedLabelIds.length === 0) {
			return [];
		}

		const labelIds = new Set<number>(encodedLabelIds.map((encodedId) => this.idHasher.decode(encodedId)));

		if (!organisation.labels || !organisation.categories) throw new Error('Categories and labels are required');

		const allCategoriesLabels = organisation.categories.map((cate) => cate.labels).flat(1) || [];
		const serviceLabel = organisation.labels || [];
		const labelsLookup = groupByKeyLastValue([...serviceLabel, ...allCategoriesLabels], (label) => label.id);

		const labelsFound: ServiceProviderLabel[] = [];
		labelIds.forEach((labelId: number) => {
			const labelFound = labelsLookup.get(labelId);
			if (!labelFound) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
					`Invalid label id: ${this.idHasher.encode(labelId)}`,
				);
			}
			labelsFound.push(labelFound);
		});
		return labelsFound;
	}

	public async fetchSpLabelsAndSpCategories(organisationId: number): Promise<{spLabels: ServiceProviderLabel[], spCategories: ServiceProviderLabelCategory[]}> {
		const spLabels: ServiceProviderLabel[] = await this.serviceProviderLabelRepository.find({organisationIds: [organisationId], categoryIds: undefined})
		const spCategories: ServiceProviderLabelCategory[] = await this.spCategoriesRepository.find({organisationId})
		return {spLabels, spCategories};

	}

	public filterSpLabelsByLabelsIdSelected(spLabels: ServiceProviderLabel[],spCategories: ServiceProviderLabelCategory[], labelsId: number[]): ServiceProviderLabel[][]{
		const filteringLabels = (spLabels:ServiceProviderLabel[], labelsId: number[] ) => (spLabels.filter(spLabel => (labelsId.some(selectedLabelIds => (selectedLabelIds === spLabel.id)))))

		const spLabelsFiltered: ServiceProviderLabel[] = filteringLabels(spLabels, labelsId);
		const spLabelsFilteredByCategories: ServiceProviderLabel[][] = [];
		if (spLabelsFiltered.length > 0) spLabelsFilteredByCategories.push(spLabelsFiltered)

		spCategories.forEach(spCategories => {
			const spLabelsFiltered: ServiceProviderLabel[] = filteringLabels(spCategories.labels, labelsId);
			if (spLabelsFiltered.length > 0) spLabelsFilteredByCategories.push(spLabelsFiltered)
		});
		return spLabelsFilteredByCategories;
	}

}
