import { DynamicField } from '../../../models';
import { DynamicFieldsRepository } from '../dynamicFields.repository';

export class DynamicFieldsRepositoryMock implements Partial<DynamicFieldsRepository> {
	public static mockGetServiceFields = jest.fn();

	public async getServiceFields(...params): Promise<DynamicField[]> {
		return DynamicFieldsRepositoryMock.mockGetServiceFields(...params);
	}
}
