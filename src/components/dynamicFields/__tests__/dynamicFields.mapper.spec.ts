import { SelectListDynamicField, SelectListOption, TextDynamicField } from '../../../models';
import { Container } from 'typescript-ioc';
import { DynamicFieldsMapper } from '../dynamicFields.mapper';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../components/labels/__mocks__/labels.mapper.mock';
import { DynamicFieldModel } from '../dynamicFields.apicontract';

describe('dynamicFields/dynamicFields.mapper', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		Container.bind(IdHasher).to(IdHasherMock);
		IdHasherMock.encode.mockImplementation((id: number) => id.toString());
		IdHasherMock.decode.mockImplementation((id: string) => Number.parseInt(id, 10));
	});

	const createSelectFieldEntity = () => {
		const listOptions = {
			key: 1,
			value: 'English',
		} as SelectListOption;
		return SelectListDynamicField.create(1, 'testDynamic', [listOptions], 1);
	};

	const createTextField = () => {
		const textField = new TextDynamicField();
		textField.id = 2;
		textField.name = 'Sample text';
		textField.charLimit = 15;

		return textField;
	};

	it('should map select list field', () => {
		const container = Container.get(DynamicFieldsMapper);
		const dynamicFieldModel = container.mapDataModel(createSelectFieldEntity());

		expect(dynamicFieldModel).toEqual({
			selectList: {
				options: [{ key: 1, value: 'English' }],
			},
			idSigned: '1',
			name: 'testDynamic',
			type: 'SelectList',
		} as DynamicFieldModel);
	});

	it('should map text field', () => {
		const container = Container.get(DynamicFieldsMapper);
		const dynamicFieldModel = container.mapDataModel(createTextField());

		expect(dynamicFieldModel).toEqual({
			textField: {
				charLimit: 15,
			},
			idSigned: '2',
			name: 'Sample text',
			type: 'TextField',
		} as DynamicFieldModel);
	});

	it('should return undefined when', () => {
		const container = Container.get(DynamicFieldsMapper);

		const dynamicFieldModel = container.mapDataModel(new SelectListDynamicField());
		expect(dynamicFieldModel).toEqual(undefined);
	});

	it('should return multiple results', () => {
		const container = Container.get(DynamicFieldsMapper);
		const dynamicFieldModel = container.mapDataModels([createSelectFieldEntity(), createTextField()]);

		expect(dynamicFieldModel).toEqual([
			{
				selectList: {
					options: [{ key: 1, value: 'English' }],
				},
				idSigned: '1',
				name: 'testDynamic',
				type: 'SelectList',
			} as DynamicFieldModel,
			{
				textField: {
					charLimit: 15,
				},
				idSigned: '2',
				name: 'Sample text',
				type: 'TextField',
			} as DynamicFieldModel,
		]);
	});
});
