import { LabelResponseModel } from './label.apicontract';
import { Label } from '../../models/entities';

export const mapToLabelsResponse = (data: Label[]): LabelResponseModel[] => {
	if (!data || data.length === 0) {
		return [];
	}
	return data.map((i) => {
		const labelData = new LabelResponseModel();
		labelData.id = i.id;
		labelData.label = i.labelText;
		return labelData;
	});
};
