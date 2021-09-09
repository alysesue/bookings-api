import { ServiceProviderLabel, Label } from '../../../models/entities';
import { LabelResponseModel } from '../label.apicontract';
import { LabelsMapper } from '../labels.mapper';

export class LabelsMapperMock implements Partial<LabelsMapper> {
	public static mapToLabelsResponse = jest.fn<LabelResponseModel[], any>();
	public static mapToLabels = jest.fn<Label[], any>();
	public static genericMappingLabels = jest.fn<Label[] | ServiceProviderLabel[], any>();
	public static mapToServiceProviderLabels = jest.fn<ServiceProviderLabel[], any>();
	public static mergeAllLabels = jest.fn<Label[] | ServiceProviderLabel[], any>();

	public mapToLabelsResponse(...param): LabelResponseModel[] {
		return LabelsMapperMock.mapToLabelsResponse(...param);
	}

	public mapToLabels(...param): Label[] {
		return LabelsMapperMock.mapToLabels(...param);
	}

	public genericMappingLabels(...param): Label[] | ServiceProviderLabel[] {
		return LabelsMapperMock.genericMappingLabels(...param);
	}

	public mapToServiceProviderLabels(...param): ServiceProviderLabel[] {
		return LabelsMapperMock.mapToServiceProviderLabels(...param);
	}

	public mergeAllLabels(...param): Label[] | ServiceProviderLabel[] {
		return LabelsMapperMock.mergeAllLabels(...param);
	}
}
