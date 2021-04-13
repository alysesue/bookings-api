import { DynamicField } from '../../../models/entities/dynamicField';

export class DynamicFieldsServiceMock {
	public static mockGetServiceFields = jest.fn();

	public async getServiceFields(...params): Promise<DynamicField[]> {
		return DynamicFieldsServiceMock.mockGetServiceFields(...params);
	}
}
