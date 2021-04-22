import { DynamicField } from '../../../models';
import { DynamicFieldModel } from '../dynamicFields.apicontract';
import { DynamicFieldsMapper } from '../dynamicFields.mapper';

export class DynamicFieldsMapperMock implements Partial<DynamicFieldsMapper> {
	public static mockMapDataModels = jest.fn<DynamicFieldModel[], any>();

	public mapDataModels(entries: DynamicField[]): DynamicFieldModel[] {
		return DynamicFieldsMapperMock.mockMapDataModels(entries);
	}
}
