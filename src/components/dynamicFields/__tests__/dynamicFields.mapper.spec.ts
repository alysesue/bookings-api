import { SelectListDynamicField, SelectListOption } from '../../../models';
import { Container } from 'typescript-ioc';
import { DynamicFieldsMapper } from '../dynamicFields.mapper';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../components/labels/__mocks__/labels.mapper.mock';
import {
	DynamicFieldModel,
	DynamicFieldType,
	SelectListModel,
	SelectListOptionModel,
} from '../dynamicFields.apicontract';

describe('dynamicFields/dynamicFields.mapper', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		Container.bind(IdHasher).to(IdHasherMock);
		IdHasherMock.encode.mockImplementation((id: number) => id.toString());
		IdHasherMock.decode.mockImplementation((id: string) => Number.parseInt(id, 10));
	});

	const listOptions = {
		key: 1,
		value: 'English',
	} as SelectListOption;
	const dynamicRepository = SelectListDynamicField.create(1, 'testDynamic', [listOptions], 1);

	const selectList = new SelectListModel();
	const selectListOption = new SelectListOptionModel();
	selectListOption.key = 1;
	selectListOption.value = 'English';
	selectList.options = [selectListOption];

	const result = new DynamicFieldModel();
	result.idSigned = '1';
	result.name = 'testDynamic';
	result.type = 'SelectList' as DynamicFieldType;
	result.SelectList = selectList;

	it('should return valid mapped result', () => {
		const container = Container.get(DynamicFieldsMapper);
		const dynamicFieldModel = container.mapDataModel(dynamicRepository);

		expect(dynamicFieldModel).toEqual(result);
	});

	it('should return undefined', () => {
		const container = Container.get(DynamicFieldsMapper);
		const dynamicFieldModel = container.mapDataModel(new SelectListDynamicField());

		expect(dynamicFieldModel).toEqual(undefined);
	});

	it('should return valid mapped results', () => {
		const container = Container.get(DynamicFieldsMapper);
		const dynamicFieldModel = container.mapDataModels([dynamicRepository]);

		expect(dynamicFieldModel).toEqual([result]);
	});
});
