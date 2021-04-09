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
			labelData.serviceId = i.serviceId;
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
			entity.serviceId = i.serviceId;
			return entity;
		});
	}
}
