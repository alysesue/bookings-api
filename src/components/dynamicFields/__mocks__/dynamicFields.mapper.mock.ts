import { DynamicField } from '../../../models';
import { DynamicFieldModel } from '../dynamicFields.apicontract';
import { DynamicFieldsMapper } from '../dynamicFields.mapper';

export class DynamicFieldsMapperMock implements Partial<DynamicFieldsMapper> {
	public static mapDataModels = jest.fn<DynamicFieldModel[], any>();
	public static mapDataModel = jest.fn<DynamicFieldModel, any>();
	public static mapToEntity = jest.fn<DynamicField, any>();

	public mapDataModels(...params): DynamicFieldModel[] {
		return DynamicFieldsMapperMock.mapDataModels(...params);
	}

	public mapDataModel(...params): DynamicFieldModel {
		return DynamicFieldsMapperMock.mapDataModel(...params);
	}

	public mapToEntity(...params): DynamicField {
		return DynamicFieldsMapperMock.mapToEntity(...params);
	}
}
