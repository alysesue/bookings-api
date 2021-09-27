import { ServiceProviderLabel, ServiceProviderLabelCategory } from '../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import { IdHasher } from '../../infrastructure/idHasher';
import {
	ServiceProviderLabelRequestModel,
	ServiceProviderLabelCategoryRequestModel,
	ServiceProviderLabelResponseModel,
	ServiceProviderLabelCategoryResponseModel,
} from './serviceProvidersLabels.apicontract';

@InRequestScope
export class SPLabelsCategoriesMapper {
	@Inject
	private idHasher: IdHasher;

	public mapToServiceProviderLabelsResponse(data: ServiceProviderLabel[] = []): ServiceProviderLabelResponseModel[] {
		return data.map((i) => {
			const labelData = new ServiceProviderLabelResponseModel();
			labelData.id = this.idHasher.encode(i.id);
			labelData.name = i.labelText;
			labelData.organisationId = this.idHasher.encode(i.organisationId);
			return labelData;
		});
	}

	public mapToServiceProviderLabels(labels: ServiceProviderLabelRequestModel[] = []): ServiceProviderLabel[] {
		// Remove duplicate labelText
		const labelNoDeepDuplicate = labels.filter(
			(label, index, self) => self.findIndex((t) => t.name === label.name && t.id === label.id) === index,
		);
		const labelNoDuplicate = SPLabelsCategoriesMapper.removeDuplicateLabels(labelNoDeepDuplicate);

		return labelNoDuplicate.map((i) => {
			const entity = new ServiceProviderLabel();
			if (i.id) {
				entity.id = this.idHasher.decode(i.id);
			}
			entity.labelText = i.name;
			return entity;
		});
	}

	// Keep duplication if id different as we have to update timeslot before deleting one (Delete Category scenario).
	private static removeDuplicateLabels(
		labels: ServiceProviderLabelRequestModel[] = [],
	): ServiceProviderLabelRequestModel[] {
		const res = labels;
		for (let i = 0; i < labels.length; i++) {
			for (let j = i + 1; j < labels.length; j++) {
				if (labels[i].name === labels[j].name) {
					if (!labels[i].id) res.splice(i, 1);
					else if (!labels[j].id) res.splice(j, 1);
				}
			}
		}
		return res;
	}

	public mergeAllLabels(
		originalList: ServiceProviderLabel[],
		updatedList: ServiceProviderLabel[],
	): ServiceProviderLabel[] {
		for (let index = 0; index < originalList.length; ) {
			const originalLabel = originalList[index];
			const foundUpdatedLabel = updatedList.find((label) => !!label.id && label.id === originalLabel.id);
			if (foundUpdatedLabel) {
				originalLabel.labelText = foundUpdatedLabel.labelText;
				index++;
			} else {
				originalList.splice(index, 1);
			}
		}

		originalList.push(...updatedList.filter((label) => !label.id));

		return originalList;
	}

	public mapToCategoriesResponse(
		data: ServiceProviderLabelCategory[] = [],
	): ServiceProviderLabelCategoryResponseModel[] {
		return data.map((i) => {
			const categoryData = new ServiceProviderLabelCategoryResponseModel();
			categoryData.id = this.idHasher.encode(i.id);
			categoryData.categoryName = i.name;
			categoryData.labels = this.mapToServiceProviderLabelsResponse(i.labels);
			categoryData.organisationId = this.idHasher.encode(i.organisationId);
			return categoryData;
		});
	}

	public mapToServiceProviderCategories(
		request: ServiceProviderLabelCategoryRequestModel[] = [],
	): ServiceProviderLabelCategory[] {
		request = request.filter((v, i, a) => a.findIndex((t) => t.categoryName === v.categoryName) === i);
		return request.map((i) => {
			const entity = new ServiceProviderLabelCategory();
			if (i.id) {
				entity.id = this.idHasher.decode(i.id);
			}
			entity.name = i.categoryName;
			entity.labels = this.mapToServiceProviderLabels(i.labels);
			return entity;
		});
	}
}
