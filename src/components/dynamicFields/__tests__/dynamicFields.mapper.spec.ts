import { SelectListDynamicField, SelectListOption, TextDynamicField } from '../../../models';
import { Container } from 'typescript-ioc';
import { DynamicFieldsMapper } from '../dynamicFields.mapper';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import {
	DynamicFieldModel,
	DynamicFieldType,
	PersistDynamicFieldModelV1,
	SelectListModel,
	TextFieldModel,
} from '../dynamicFields.apicontract';
import { MyInfoFieldType } from '../../../models/entities/myInfoFieldType';
import { MyInfoDynamicField } from '../../../models/entities/dynamicField';
import { ContainerContextHolder } from '../../../infrastructure/containerContext';

beforeAll(() => {
	Container.bind(IdHasher).to(IdHasherMock);
	ContainerContextHolder.registerInContainer();
});

describe('dynamicFields/dynamicFields.mapper', () => {
	beforeEach(() => {
		jest.resetAllMocks();

		IdHasherMock.encode.mockImplementation((id: number) => id.toString());
		IdHasherMock.decode.mockImplementation((id: string) => Number.parseInt(id, 10));
	});

	const createSelectFieldEntity = () => {
		const listOptions = {
			key: 1,
			value: 'English',
		} as SelectListOption;
		const field = SelectListDynamicField.create(1, 'testDynamic', [listOptions], true);
		field.id = 1;
		return field;
	};

	const createTextField = () => {
		const textField = new TextDynamicField();
		textField.id = 2;
		textField.name = 'Sample text';
		textField.charLimit = 15;
		textField.isMandatory = true;

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
			isMandatory: true,
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
			isMandatory: true,
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
				isMandatory: true,
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
				isMandatory: true,
			} as DynamicFieldModel,
		]);
	});

	it('[Select List] should map to new entity V1', () => {
		const request = new PersistDynamicFieldModelV1();
		request.serviceId = 1;
		request.name = 'options';
		request.type = DynamicFieldType.SelectList;
		request.selectList = new SelectListModel();
		request.selectList.options = [{ key: 1, value: 'option A' }];
		request.isMandatory = true;

		const instance = Container.get(DynamicFieldsMapper);
		const mapped = instance.mapToEntity(request, null);
		expect(mapped).toEqual({
			_isMandatory: true,
			_name: 'options',
			_options: [
				{
					key: 1,
					value: 'option A',
				},
			],
			_serviceId: 1,
		});
	});

	it('[Select List] should map to existing entity', () => {
		const request = new PersistDynamicFieldModelV1();
		request.serviceId = 1;
		request.name = 'options';
		request.type = DynamicFieldType.SelectList;
		request.selectList = new SelectListModel();
		request.selectList.options = [{ key: 1, value: 'option A' }];
		request.isMandatory = true;

		const instance = Container.get(DynamicFieldsMapper);
		const entity = SelectListDynamicField.create(1, 'field', [], true);
		entity.id = 11;

		const mapped = instance.mapToEntity(request, entity);
		expect(mapped).toBe(entity);
		expect(mapped).toEqual({
			_id: 11,
			_name: 'options',
			_isMandatory: true,
			_options: [
				{
					key: 1,
					value: 'option A',
				},
			],
			_serviceId: 1,
		});
	});

	it('[Select List] should NOT accept options with key as zero', () => {
		const request = new PersistDynamicFieldModelV1();
		request.serviceId = 1;
		request.name = 'options';
		request.type = DynamicFieldType.SelectList;
		request.selectList = new SelectListModel();
		request.selectList.options = [
			{ key: 0, value: 'option A' },
			{ key: 1, value: 'option B' },
		];
		request.isMandatory = true;

		const instance = Container.get(DynamicFieldsMapper);

		const _test = () => instance.mapToEntity(request, null);
		expect(_test).toThrowErrorMatchingInlineSnapshot('"Select list field must not contain option with key 0."');
	});

	it('[Select List] should accept options with keys other than zero', () => {
		const request = new PersistDynamicFieldModelV1();
		request.serviceId = 1;
		request.name = 'options';
		request.type = DynamicFieldType.SelectList;
		request.selectList = new SelectListModel();
		request.selectList.options = [
			{ key: 1, value: 'option A' },
			{ key: 2, value: 'option B' },
		];
		request.isMandatory = true;

		const instance = Container.get(DynamicFieldsMapper);
		const entity = SelectListDynamicField.create(1, 'field', [], true);
		entity.id = 11;

		const mapped = instance.mapToEntity(request, entity);
		expect(mapped).toBe(entity);
		expect(mapped).toEqual({
			_id: 11,
			_name: 'options',
			_isMandatory: true,
			_options: [
				{
					key: 1,
					value: 'option A',
				},
				{
					key: 2,
					value: 'option B',
				},
			],
			_serviceId: 1,
		});
	});

	it('[Select List] should NOT map to with missing information', () => {
		const request = new PersistDynamicFieldModelV1();
		request.serviceId = 1;
		request.name = 'options';
		request.type = DynamicFieldType.SelectList;

		const instance = Container.get(DynamicFieldsMapper);

		const _test = () => instance.mapToEntity(request, null);
		expect(_test).toThrowErrorMatchingInlineSnapshot('"Select list field must contain at least one option."');
	});

	it('[Select List] should NOT map to existing entity - mapping to TextField', () => {
		const request = new PersistDynamicFieldModelV1();
		request.serviceId = 1;
		request.name = 'options';
		request.type = DynamicFieldType.SelectList;
		request.selectList = new SelectListModel();
		request.selectList.options = [{ key: 1, value: 'option A' }];

		const instance = Container.get(DynamicFieldsMapper);
		const entity = TextDynamicField.create(1, 'notes', 10, true);
		entity.id = 11;

		const _test = () => instance.mapToEntity(request, entity);
		expect(_test).toThrowErrorMatchingInlineSnapshot('"Type for field notes cannot be changed once is set."');
	});

	it('[Text field] should map to new entity', () => {
		const request = new PersistDynamicFieldModelV1();
		request.serviceId = 1;
		request.name = 'notes';
		request.type = DynamicFieldType.TextField;
		request.textField = new TextFieldModel();
		request.textField.charLimit = 15;
		request.isMandatory = true;

		const instance = Container.get(DynamicFieldsMapper);
		const mapped = instance.mapToEntity(request, null);
		expect(mapped).toEqual({
			_isMandatory: true,
			_name: 'notes',
			_charLimit: 15,
			_serviceId: 1,
		});
	});

	it('[Text field] should map to existing entity', () => {
		const request = new PersistDynamicFieldModelV1();
		request.serviceId = 1;
		request.name = 'notes';
		request.type = DynamicFieldType.TextField;
		request.textField = new TextFieldModel();
		request.textField.charLimit = 15;
		request.isMandatory = true;

		const instance = Container.get(DynamicFieldsMapper);
		const entity = TextDynamicField.create(1, 'field', 20, true);
		entity.id = 11;

		const mapped = instance.mapToEntity(request, entity);
		expect(mapped).toBe(entity);
		expect(mapped).toEqual({
			_id: 11,
			_name: 'notes',
			_isMandatory: true,
			_charLimit: 15,
			_serviceId: 1,
		});
	});

	it('[Text field] should NOT map to existing entity - mapping to Select List', () => {
		const request = new PersistDynamicFieldModelV1();
		request.serviceId = 1;
		request.name = 'notes';
		request.type = DynamicFieldType.TextField;
		request.textField = new TextFieldModel();
		request.textField.charLimit = 15;

		const instance = Container.get(DynamicFieldsMapper);
		const entity = SelectListDynamicField.create(1, 'options', [], true);
		entity.id = 11;

		const _test = () => instance.mapToEntity(request, entity);
		expect(_test).toThrowErrorMatchingInlineSnapshot('"Type for field options cannot be changed once is set."');
	});

	it('[Text field] should NOT map to with missing information', () => {
		const request = new PersistDynamicFieldModelV1();
		request.serviceId = 1;
		request.name = 'notes';
		request.type = DynamicFieldType.TextField;

		const instance = Container.get(DynamicFieldsMapper);

		const _test = () => instance.mapToEntity(request, null);
		expect(_test).toThrowErrorMatchingInlineSnapshot('"Text field char limit must be at least 1."');
	});

	it('[Custom field] should require name for non myInfo fields', () => {
		const request = new PersistDynamicFieldModelV1();
		request.serviceId = 1;
		request.type = DynamicFieldType.TextField;
		request.textField = new TextFieldModel();
		request.textField.charLimit = 15;
		request.isMandatory = true;

		const instance = Container.get(DynamicFieldsMapper);
		const testCase = () => instance.mapToEntity(request, null);
		const testCase2 = () => instance.mapToEntity({ ...request, name: '' }, null);

		expect(testCase).toThrowErrorMatchingInlineSnapshot(`"Name must be specified for custom field."`);
		expect(testCase2).toThrowErrorMatchingInlineSnapshot(`"Name must be specified for custom field."`);
	});

	it('[Custom field] should require type for non myInfo fields', () => {
		const request = new PersistDynamicFieldModelV1();
		request.serviceId = 1;
		request.name = 'Notes';
		request.textField = new TextFieldModel();
		request.textField.charLimit = 15;
		request.isMandatory = true;

		const instance = Container.get(DynamicFieldsMapper);
		const testCase = () => instance.mapToEntity(request, null);

		expect(testCase).toThrowErrorMatchingInlineSnapshot(`"Type must be specified for custom field: Notes."`);
	});

	it('[My Info] should map from api to New entity', () => {
		const request: PersistDynamicFieldModelV1 = {
			serviceId: 10,
			myInfoFieldType: MyInfoFieldType.regadd_postal,
		};

		const instance = Container.get(DynamicFieldsMapper);
		const result = instance.mapToEntity(request, null);

		expect(result).toBeDefined();
		expect(result instanceof MyInfoDynamicField).toBe(true);
		expect(result).toEqual({
			_serviceId: 10,
			_myInfoFieldType: 'regadd_postal',
			_name: 'Postal code',
			_isMandatory: false,
		});
	});

	it('[My Info] should map from api to an existing entity', () => {
		const request: PersistDynamicFieldModelV1 = {
			idSigned: '2',
			name: 'P',
			myInfoFieldType: MyInfoFieldType.regadd_postal,
		};
		const entity = new MyInfoDynamicField();
		entity.id = 2;
		entity.name = 'Postal';
		entity.myInfoFieldType = MyInfoFieldType.regadd_postal;

		const instance = Container.get(DynamicFieldsMapper);
		const result = instance.mapToEntity(request, entity);

		expect(result).toBeDefined();
		expect(result instanceof MyInfoDynamicField).toBe(true);
		expect(result).toEqual({
			_id: 2,
			_myInfoFieldType: 'regadd_postal',
			_name: 'P',
		});
	});

	it('[My Info] should NOT map from api to an existing entity - with different myInfo field', () => {
		const request: PersistDynamicFieldModelV1 = {
			idSigned: '2',
			name: 'P',
			myInfoFieldType: MyInfoFieldType.regadd_postal,
		};
		const entity = new MyInfoDynamicField();
		entity.id = 2;
		entity.name = 'Nationality';
		entity.myInfoFieldType = MyInfoFieldType.nationality;

		const instance = Container.get(DynamicFieldsMapper);
		const testCase = () => instance.mapToEntity(request, entity);

		expect(testCase).toThrowErrorMatchingInlineSnapshot(
			`"Type for myInfo field Nationality cannot be changed once is set."`,
		);
	});

	it('[My Info] should not be able to change myInfoFieldType to simple TextField', () => {
		const request: PersistDynamicFieldModelV1 = {
			idSigned: '2',
			name: 'P',
			type: DynamicFieldType.TextField,
			textField: {
				charLimit: 5,
			},
		};
		const entity = new MyInfoDynamicField();
		entity.id = 2;
		entity.name = 'Postal';
		entity.myInfoFieldType = MyInfoFieldType.regadd_postal;

		const instance = Container.get(DynamicFieldsMapper);
		const testCase = () => instance.mapToEntity(request, entity);

		expect(testCase).toThrowErrorMatchingInlineSnapshot(`"Type for field Postal cannot be changed once is set."`);
	});

	it('[My Info] should map from entity to api', () => {
		const entity = new MyInfoDynamicField();
		entity.id = 2;
		entity.name = 'Postal';
		entity.myInfoFieldType = MyInfoFieldType.regadd_postal;
		entity.isMandatory = false;

		const instance = Container.get(DynamicFieldsMapper);
		const apiModel = instance.mapDataModel(entity);

		expect(apiModel).toEqual({
			idSigned: '2',
			isMandatory: false,
			name: 'Postal',
			myInfoFieldType: 'regadd_postal',
			type: 'TextField',
			textField: {
				charLimit: 6,
			},
			isCitizenReadonly: true,
		});
	});
});
