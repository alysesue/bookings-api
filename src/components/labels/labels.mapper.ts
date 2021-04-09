import { LabelRequestModel, LabelResponseModel } from './label.apicontract';
import { Label } from '../../models/entities';
import { Inject, InRequestScope } from 'typescript-ioc';
import { IdHasher } from '../../infrastructure/idHasher';

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

	public mapToLabels(request: LabelRequestModel[] = []): Label[] {
		// Remove duplicate labelText
		request = request.filter((v, i, a) => a.findIndex((t) => t.label === v.label) === i);
		return request.map((i) => {
			const entity = new Label();
			if (i.id) {
				entity.id = this.idHasher.decode(i.id);
			}
			entity.labelText = i.label;
			return entity;
		});
	}

	public mergeLabels(originalList: Label[], updatedList: Label[]): Label[] {
		updatedList.forEach((label) => {
			if (label.id) {
				const foundLabel = originalList.find((l) => l.id === label.id);
				if (foundLabel) {
					foundLabel.labelText = label.labelText;
				}
			} else {
				originalList.push(label);
			}
		});

		originalList.forEach((originalLabel, index) => {
			const foundUpdatedLabel = updatedList.find((l) => l.id === originalLabel.id);
			if (!foundUpdatedLabel) {
				originalList.splice(index, 1);
			}
		});

		return originalList;
	}
}
