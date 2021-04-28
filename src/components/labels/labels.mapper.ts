import { Inject, InRequestScope } from 'typescript-ioc';
import { Label } from '../../models/entities';
import { IdHasher } from '../../infrastructure/idHasher';
import { LabelRequestModel, LabelResponseModel } from './label.apicontract';

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
		for (let index = 0; index < originalList.length; ) {
			const originalLabel = originalList[index];
			const foundUpdatedLabel = updatedList.find((l) => !!l.id && l.id === originalLabel.id);
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
}
