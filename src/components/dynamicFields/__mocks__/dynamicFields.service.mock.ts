import { DynamicField } from '../../../models/entities/dynamicField';
import { DynamicFieldsService } from '../dynamicFields.service';

export class DynamicFieldsServiceMock implements Partial<DynamicFieldsService> {
	public static mockGetServiceFields = jest.fn();

	public async getServiceFields(...params): Promise<DynamicField[]> {
		return DynamicFieldsServiceMock.mockGetServiceFields(...params);
	}
}
