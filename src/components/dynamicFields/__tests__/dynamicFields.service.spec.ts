import { SelectListDynamicField, SelectListOption } from '../../../models';
import { Container } from 'typescript-ioc';
import { DynamicFieldsRepository } from '../dynamicFields.repository';
import { DynamicFieldsService } from '../dynamicFields.service';
import { DynamicFieldsRepositoryMock } from '../__mocks__/dynamicFields.repository.mock';

beforeAll(() => {
	Container.bind(DynamicFieldsRepository).to(DynamicFieldsRepositoryMock);
});

describe('dynamicFields/dynamicFields.service', () => {
	beforeEach(() => {});

	const listOptions = {
		key: 1,
		value: 'English',
	} as SelectListOption;
	const dynamicRepository = SelectListDynamicField.create(1, 'testDynamic', [listOptions], 1);

	it('should return query result', async () => {
		const container = Container.get(DynamicFieldsService);
		DynamicFieldsRepositoryMock.mockGetServiceFields.mockImplementation(() => [dynamicRepository]);
		const result = await container.getServiceFields(1);

		expect(result).toEqual([dynamicRepository]);
	});
});
