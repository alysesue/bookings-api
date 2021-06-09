import { Container } from 'typescript-ioc';
import { DynamicFieldsService } from '../dynamicFields.service';
import { DynamicFieldsServiceMock } from '../__mocks__/dynamicFields.service.mock';
import { DynamicFieldsMapper } from '../dynamicFields.mapper';
import { DynamicFieldsMapperMock } from '../__mocks__/dynamicFields.mapper.mock';
import {
	DynamicFieldModel,
	DynamicFieldType,
	PersistDynamicFieldModel,
	SelectListModel,
	SelectListOptionModel,
} from '../dynamicFields.apicontract';
import { DynamicFieldsController } from '../dynamicFields.controller';
import { TextDynamicField } from '../../../models';

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
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should create dynamic field', async () => {
		const request = new PersistDynamicFieldModel();
		request.name = 'field';
		request.type = DynamicFieldType.TextField;
		request.textField = { charLimit: 50 };

		const model = new DynamicFieldModel();
		model.idSigned = '11';
		const entity = TextDynamicField.create(1, 'notes', 50);

		DynamicFieldsMapperMock.mapDataModel.mockReturnValue(model);
		DynamicFieldsServiceMock.save.mockReturnValue(Promise.resolve(entity));

		const instance = Container.get(DynamicFieldsController);
		const result = await instance.create(request, 2);

		expect(DynamicFieldsServiceMock.save).toBeCalled();
		expect(DynamicFieldsMapperMock.mapDataModel).toBeCalled();
		expect(result).toEqual({ data: model });
	});

	it('should update dynamic field', async () => {
		const request = new PersistDynamicFieldModel();
		request.name = 'field';
		request.type = DynamicFieldType.TextField;
		request.textField = { charLimit: 50 };

		const model = new DynamicFieldModel();
		model.idSigned = '11';
		const entity = TextDynamicField.create(1, 'notes', 50);

		DynamicFieldsMapperMock.mapDataModel.mockReturnValue(model);
		DynamicFieldsServiceMock.update.mockReturnValue(Promise.resolve(entity));

		const instance = Container.get(DynamicFieldsController);
		const result = await instance.update('11', request);

		expect(DynamicFieldsServiceMock.update).toBeCalled();
		expect(DynamicFieldsMapperMock.mapDataModel).toBeCalled();
		expect(result).toEqual({ data: model });
	});

	it('should delete dynamic field', async () => {
		DynamicFieldsServiceMock.delete.mockReturnValue(Promise.resolve());

		const instance = Container.get(DynamicFieldsController);
		await instance.delete('11');

		expect(DynamicFieldsServiceMock.delete).toBeCalled();
	});

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

		DynamicFieldsMapperMock.mapDataModels.mockImplementation(() => [dynamicFieldModel]);
		const container = Container.get(DynamicFieldsController);
		const result = await container.getDynamicFields(1);

		expect(DynamicFieldsServiceMock.getServiceFields).toBeCalled();
		expect(DynamicFieldsMapperMock.mapDataModels).toBeCalled();
		expect(result).toBeDefined();
		expect(result.data).toEqual([dynamicFieldModel]);
	});
});
