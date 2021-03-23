import { LabelRequestModel, LabelResponseModel } from './label.apicontract';
import { Label } from '../../models/entities';
import { Inject } from 'typescript-ioc';
import { IdHasher } from '../../infrastructure/idHasher';

export class LabelsMapper {
	@Inject
	private idHasher: IdHasher;

	public mapToLabelsResponse(data: Label[] = []): LabelResponseModel[] {
		if (!data || data.length === 0) {
			return [];
		}
		return data.map((i) => {
			const labelData = new LabelResponseModel();
			labelData.id = this.idHasher.encode(i.id);
			labelData.label = i.labelText;
			return labelData;
		});
	}

	public mapToLabels(request: LabelRequestModel[] = []): Label[] {
		return request.map((i) => {
			const entity = new Label();
			if (i.id) {
				entity.id = this.idHasher.decode(i.id);
			}
			entity.labelText = i.label;
			return entity;
		});
	}
}
