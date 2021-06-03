import { Container } from 'typescript-ioc';
import { DynamicFieldsService } from '../dynamicFields.service';
import { DynamicFieldsServiceMock } from '../__mocks__/dynamicFields.service.mock';
import { DynamicFieldsMapper } from '../dynamicFields.mapper';
import { DynamicFieldsMapperMock } from '../__mocks__/dynamicFields.mapper.mock';
import {
	DynamicFieldModel,
	DynamicFieldType,
	SelectListModel,
	SelectListOptionModel,
} from '../dynamicFields.apicontract';
import { DynamicFieldsController } from '../dynamicFields.controller';

jest.mock('../dynamicFields.service', () => {
	class DynamicFieldsService {}
	return { DynamicFieldsService };
});
jest.mock('../dynamicFields.mapper', () => {
	class DynamicFieldsMapper {}
	return { DynamicFieldsMapper };
});

beforeAll(() => {
	Container.bind(DynamicFieldsService).to(DynamicFieldsServiceMock);
	Container.bind(DynamicFieldsMapper).to(DynamicFieldsMapperMock);
});

describe('dynamicFields/dynamicFields.controller', () => {
	beforeEach(() => {});

	it('should return api result', async () => {
		const selectOption = new SelectListOptionModel();
		selectOption.key = 1;
		selectOption.value = 'abc';
		const dynamicFieldModel = new DynamicFieldModel();
		dynamicFieldModel.idSigned = '1';
		dynamicFieldModel.name = 'testDynamicController';
		dynamicFieldModel.type = DynamicFieldType.SelectList;
		dynamicFieldModel.selectList = new SelectListModel();
		dynamicFieldModel.selectList.options = [selectOption];

		DynamicFieldsMapperMock.mockMapDataModels.mockImplementation(() => [dynamicFieldModel]);
		const container = Container.get(DynamicFieldsController);
		const result = await container.getDynamicFields(1);

		expect(DynamicFieldsServiceMock.mockGetServiceFields).toBeCalled();
		expect(DynamicFieldsMapperMock.mockMapDataModels).toBeCalled();
		expect(result).toBeDefined();
		expect(result.data).toEqual([dynamicFieldModel]);
	});
});
