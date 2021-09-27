import { Inject, InRequestScope } from 'typescript-ioc';
import { Label } from '../../models';
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

	public mapToLabels(labels: LabelRequestModel[] = []): Label[] {
		// Remove duplicate labelText
		const labelNoDeepDuplicate = labels.filter(
			(label, index, self) => self.findIndex((t) => t.label === label.label && t.id === label.id) === index,
		);
		const labelNoDuplicate = LabelsMapper.removeDuplicateLabels(labelNoDeepDuplicate);

		return labelNoDuplicate.map((i) => {
			const entity = new Label();
			if (i.id) {
				entity.id = this.idHasher.decode(i.id);
			}
			entity.labelText = i.label;
			return entity;
		});
	}

	// Keep duplication if id different as we have to update timeslot before deleting one (Delete Category scenario).
	private static removeDuplicateLabels(labels: LabelRequestModel[] = []): LabelRequestModel[] {
		const res = labels;
		for (let i = 0; i < labels.length; i++) {
			for (let j = i + 1; j < labels.length; j++) {
				if (labels[i].label === labels[j].label) {
					if (!labels[i].id) res.splice(i, 1);
					else if (!labels[j].id) res.splice(j, 1);
				}
			}
		}
		return res;
	}

	public mergeAllLabels(originalList: Label[], updatedList: Label[]): Label[] {
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
}
