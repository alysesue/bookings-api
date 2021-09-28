import { Label } from '../../../models/entities';
import { LabelResponseModel } from '../label.apicontract';
import { LabelsMapper } from '../labels.mapper';

export class LabelsMapperMock implements Partial<LabelsMapper> {
	public static mapToLabelsResponse = jest.fn<LabelResponseModel[], any>();
	public static mapToLabels = jest.fn<Label[], any>();
	public static mergeAllLabels = jest.fn<Label[], any>();

	public mapToLabelsResponse(...param): LabelResponseModel[] {
		return LabelsMapperMock.mapToLabelsResponse(...param);
	}

	public mapToLabels(...param): Label[] {
		return LabelsMapperMock.mapToLabels(...param);
	}

	public mergeAllLabels(...param): Label[] {
		return LabelsMapperMock.mergeAllLabels(...param);
	}
}
