import { DynamicField } from '../../../models';
import { DynamicFieldsRepository } from '../dynamicFields.repository';

export class DynamicFieldsRepositoryMock implements Partial<DynamicFieldsRepository> {
	public static getServiceFields = jest.fn<Promise<DynamicField[]>, any>();
	public static save = jest.fn<Promise<DynamicField>, any>();
	public static get = jest.fn<Promise<DynamicField>, any>();

	public async getServiceFields(...params): Promise<DynamicField[]> {
		return DynamicFieldsRepositoryMock.getServiceFields(...params);
	}

	public async save(...params): Promise<DynamicField> {
		return DynamicFieldsRepositoryMock.save(...params);
	}

	public async get(...params): Promise<DynamicField> {
		return DynamicFieldsRepositoryMock.get(...params);
	}
}
