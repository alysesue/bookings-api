import { DynamicField } from '../../../models/entities/dynamicField';
import { DynamicFieldsService } from '../dynamicFields.service';

export class DynamicFieldsServiceMock implements Partial<DynamicFieldsService> {
	public static getServiceFields = jest.fn<Promise<DynamicField[]>, any>();
	public static save = jest.fn<Promise<DynamicField>, any>();
	public static update = jest.fn<Promise<DynamicField>, any>();

	public async getServiceFields(...params): Promise<DynamicField[]> {
		return DynamicFieldsServiceMock.getServiceFields(...params);
	}

	public async save(...params): Promise<DynamicField> {
		return DynamicFieldsServiceMock.save(...params);
	}

	public async update(...params): Promise<DynamicField> {
		return DynamicFieldsServiceMock.update(...params);
	}
}
