import { Inject, InRequestScope } from 'typescript-ioc';
import { Label, ServiceProviderLabel } from '../../models';
import { IdHasher } from '../../infrastructure/idHasher';
import { LabelRequestModel, LabelResponseModel } from './label.apicontract';
import { LabelResponse } from './label.enum';
import { ServiceProviderLabelRequestModel } from '../serviceProvidersLabels/serviceProvidersLabels.apicontract';

@InRequestScope
export class LabelsMapper {
	@Inject
	private idHasher: IdHasher;

	public mapToLabelsResponse(data: Label[] = []): LabelResponseModel[] {
		return data.map((i) => {
			const labelData = new LabelResponseModel();
			labelData.id = this.idHasher.encode(i.id);
			labelData.label = i.labelText;
			return labelData;
		});
	}

	public mapToLabels(labels: LabelRequestModel[] = []): Label[] {
		// Request mapping, so we can use the same remove duplicate label function (to refactor API for service to be {id, name} in the future)
		const mappedLabels = this.mapRequest(labels);

		return this.genericMappingLabels(mappedLabels, LabelResponse.SERVICE) as Label[];
	}

	public genericMappingLabels(
		labels: ServiceProviderLabelRequestModel[],
		response: LabelResponse,
	): Label[] | ServiceProviderLabel[] {
		// Remove duplicate labelText
		const labelNoDeepDuplicate = labels.filter(
			(label, index, self) => self.findIndex((t) => t.name === label.name && t.id === label.id) === index,
		);
		const labelNoDuplicate = LabelsMapper.removeDuplicateLabels(labelNoDeepDuplicate);

		switch (response) {
			case LabelResponse.SERVICE:
				return labelNoDuplicate.map((i) => {
					const entity = new Label();
					if (i.id) {
						entity.id = this.idHasher.decode(i.id);
					}
					entity.labelText = i.name;
					return entity;
				});
			case LabelResponse.SERVICE_PROVIDER:
				return labelNoDuplicate.map((i) => {
					const entity = new ServiceProviderLabel();
					if (i.id) {
						entity.id = this.idHasher.decode(i.id);
					}
					entity.labelText = i.name;
					return entity;
				});
		}
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

	public mergeAllLabels(originalList: any, updatedList: any): Label[] | ServiceProviderLabel[] {
		for (let index = 0; index < originalList.length; ) {
			const originalLabel = originalList[index];
			const foundUpdatedLabel = updatedList.find(
				(label: Label | ServiceProviderLabel) => !!label.id && label.id === originalLabel.id,
			);
			if (foundUpdatedLabel) {
				originalLabel.labelText = foundUpdatedLabel.labelText;
				index++;
			} else {
				originalList.splice(index, 1);
			}
		}

		originalList.push(...updatedList.filter((label: Label | ServiceProviderLabel) => !label.id));

		return originalList;
	}

	private mapRequest(labels: LabelRequestModel[]): ServiceProviderLabelRequestModel[] {
		const serviceProviderLabels: ServiceProviderLabelRequestModel[] = [];
		labels.map((label) => {
			const serviceProviderLabel = new ServiceProviderLabelRequestModel();
			serviceProviderLabel.id = label.id;
			serviceProviderLabel.name = label.label;
			serviceProviderLabels.push(serviceProviderLabel);
		});
		return serviceProviderLabels;
	}
}
