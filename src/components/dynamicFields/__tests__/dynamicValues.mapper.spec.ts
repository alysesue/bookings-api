import { Container } from 'typescript-ioc';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { DynamicValueJsonModel, DynamicValueType } from '../../../models/entities/jsonModels';
import { DynamicValuesMapper, DynamicValuesRequestMapper, MapRequestOptionalResult } from '../dynamicValues.mapper';
import {
	DynamicValueContract,
	DynamicValueTypeContract,
	PersistDynamicValueContract,
} from '../dynamicValues.apicontract';
import { DynamicFieldsService } from '../dynamicFields.service';
import { DynamicFieldsServiceMock } from '../__mocks__/dynamicFields.service.mock';
import {
	BusinessValidation,
	DateOnlyDynamicField,
	SelectListDynamicField,
	SelectListOption,
	TextDynamicField,
} from '../../../models';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { ContainerContextHolder } from '../../../infrastructure/containerContext';

import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';

jest.mock('../dynamicFields.service', () => {
	class DynamicFieldsService {}
	return {
		DynamicFieldsService,
	};
});

beforeAll(() => {
	Container.bind(IdHasher).to(IdHasherMock);
	Container.bind(DynamicFieldsService).to(DynamicFieldsServiceMock);
	Container.bind(UserContext).to(UserContextMock);
	ContainerContextHolder.registerInContainer();
});

describe('dynamicFields/dynamicValues.mapper', () => {
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

	const createDateField = ({ isMandatory }: { isMandatory: boolean }) => {
		const dateField = new DateOnlyDynamicField();
		dateField.id = 3;
		dateField.name = 'Sample date';
		dateField.isMandatory = isMandatory;
		return dateField;
	};

	beforeEach(() => {
		jest.resetAllMocks();

		IdHasherMock.encode.mockImplementation((id: number) => id.toString());
		IdHasherMock.decode.mockImplementation((id: string) => Number.parseInt(id, 10));
	});

	it('[Response] should map select list dynamic field value ', async () => {
		const dynamicValueJson = {
			fieldId: 1,
			fieldName: 'testname',
			type: 'SingleSelection' as DynamicValueType,
			SingleSelectionKey: 1,
			SingleSelectionValue: 'test',
		} as DynamicValueJsonModel;

		const mapper = Container.get(DynamicValuesMapper);
		const dynamicReturn = mapper.mapDynamicValuesModel([dynamicValueJson]);

		expect(dynamicReturn).toEqual([
			{
				fieldIdSigned: '1',
				fieldName: 'testname',
				type: 'SingleSelection',
				singleSelectionKey: 1,
				singleSelectionValue: 'test',
			} as DynamicValueContract,
		]);
	});

	it('[Response] should map select list dynamic field value to string ', async () => {
		const dynamicValueJson = {
			fieldId: 1,
			fieldName: 'testname',
			type: 'SingleSelection' as DynamicValueType,
			SingleSelectionKey: 1,
			SingleSelectionValue: 'test',
		} as DynamicValueJsonModel;

		const mapper = Container.get(DynamicValuesMapper);
		const str = mapper.getValueAsString(dynamicValueJson);

		expect(str).toEqual('test');
	});

	it('[Response] should map text dynamic field value ', async () => {
		const dynamicValueJson = {
			fieldId: 1,
			fieldName: 'testname',
			type: DynamicValueType.Text,
			textValue: 'some text',
		} as DynamicValueJsonModel;

		const mapper = Container.get(DynamicValuesMapper);
		const dynamicReturn = mapper.mapDynamicValuesModel([dynamicValueJson]);
		expect(dynamicReturn).toEqual([
			{
				fieldIdSigned: '1',
				fieldName: 'testname',
				textValue: 'some text',
				type: 'Text',
			},
		]);
	});

	it('[Response] should map dateOnly dynamic field value ', async () => {
		const dynamicValueJson = {
			fieldId: 1,
			fieldName: 'testname',
			type: DynamicValueType.DateOnly,
			dateOnlyValue: '2021-02-20',
		} as DynamicValueJsonModel;

		const mapper = Container.get(DynamicValuesMapper);
		const dynamicReturn = mapper.mapDynamicValuesModel([dynamicValueJson]);
		expect(dynamicReturn).toEqual([
			{
				fieldIdSigned: '1',
				fieldName: 'testname',
				type: DynamicValueType.DateOnly,
				dateOnlyValue: '2021-02-20',
			},
		]);
	});

	it('[Response] should map dateOnly dynamic field value to string ', async () => {
		const dynamicValueJson = {
			fieldId: 1,
			fieldName: 'testname',
			type: DynamicValueType.DateOnly,
			dateOnlyValue: '2021-02-20',
		} as DynamicValueJsonModel;

		const mapper = Container.get(DynamicValuesMapper);
		const str = mapper.getValueAsString(dynamicValueJson);
		expect(str).toEqual('2021-02-20');
	});

	it('[Response] should map text dynamic field value to string', async () => {
		const dynamicValueJson = {
			fieldId: 1,
			fieldName: 'testname',
			type: DynamicValueType.Text,
			textValue: 'some text',
		} as DynamicValueJsonModel;

		const mapper = Container.get(DynamicValuesMapper);
		const str = mapper.getValueAsString(dynamicValueJson);
		expect(str).toEqual('some text');
	});

	it('[Response] should return empty array when no dynamic values are passed ', async () => {
		const mapper = Container.get(DynamicValuesMapper);
		const dynamicReturn = mapper.mapDynamicValuesModel([]);

		expect(dynamicReturn).toEqual([]);
	});

	it(`should map request fields`, async () => {
		DynamicFieldsServiceMock.getServiceFields.mockImplementation(() =>
			Promise.resolve([createSelectFieldEntity(), createTextField()]),
		);

		const dynamicValue = new PersistDynamicValueContract();
		dynamicValue.fieldIdSigned = '1';
		dynamicValue.type = DynamicValueTypeContract.SingleSelection;
		dynamicValue.singleSelectionKey = 1;

		const dynamicValue2 = new PersistDynamicValueContract();
		dynamicValue2.fieldIdSigned = '2';
		dynamicValue2.type = DynamicValueTypeContract.Text;
		dynamicValue2.textValue = 'some text';

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([dynamicValue, dynamicValue2], [], 100);

		expect(dynamicReturn).toEqual({
			result: [
				{
					SingleSelectionKey: 1,
					SingleSelectionValue: 'English',
					fieldId: 1,
					fieldName: 'testDynamic',
					type: 'SingleSelection',
					origin: { originType: 'bookingsg' },
				},
				{
					fieldId: 2,
					fieldName: 'Sample text',
					textValue: 'some text',
					type: 'Text',
					origin: { originType: 'bookingsg' },
				},
			],
		} as MapRequestOptionalResult);
	});

	it(`should map empty text field when field is not required`, async () => {
		const field = createTextField();
		field.isMandatory = false;
		DynamicFieldsServiceMock.getServiceFields.mockImplementation(() => Promise.resolve([field]));

		const dynamicValue2 = new PersistDynamicValueContract();
		dynamicValue2.fieldIdSigned = '2';
		dynamicValue2.type = DynamicValueTypeContract.Text;
		dynamicValue2.textValue = undefined;

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([dynamicValue2], [], 100);

		expect(dynamicReturn).toEqual({
			result: [
				{
					fieldId: 2,
					fieldName: 'Sample text',
					origin: { originType: 'bookingsg' },
				},
			],
		} as MapRequestOptionalResult);
	});

	it(`should validate dynamic fields are required`, async () => {
		DynamicFieldsServiceMock.getServiceFields.mockImplementation(() =>
			Promise.resolve([createSelectFieldEntity(), createTextField()]),
		);

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([], [], 100);

		expect(dynamicReturn).toEqual({
			errorResult: [
				new BusinessValidation({
					code: '10202',
					message: 'testDynamic field is required.',
				}),
				new BusinessValidation({
					code: '10202',
					message: 'Sample text field is required.',
				}),
			],
		} as MapRequestOptionalResult);
	});

	it(`should validate dynamic fields are required (object provided but value is empty)`, async () => {
		DynamicFieldsServiceMock.getServiceFields.mockImplementation(() =>
			Promise.resolve([createSelectFieldEntity(), createTextField()]),
		);

		const dynamicValue = new PersistDynamicValueContract();
		dynamicValue.fieldIdSigned = '1';
		dynamicValue.type = DynamicValueTypeContract.SingleSelection;
		dynamicValue.singleSelectionKey = undefined;

		const dynamicValue2 = new PersistDynamicValueContract();
		dynamicValue2.fieldIdSigned = '2';
		dynamicValue2.type = DynamicValueTypeContract.Text;
		dynamicValue2.textValue = undefined;

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([dynamicValue, dynamicValue2], [], 100);

		expect(dynamicReturn).toEqual({
			errorResult: [
				new BusinessValidation({
					code: '10202',
					message: 'testDynamic field is required.',
				}),
				new BusinessValidation({
					code: '10202',
					message: 'Sample text field is required.',
				}),
			],
		} as MapRequestOptionalResult);
	});

	it(`should validate value type for dynamic fields`, async () => {
		DynamicFieldsServiceMock.getServiceFields.mockImplementation(() =>
			Promise.resolve([createSelectFieldEntity(), createTextField()]),
		);

		const dynamicValue = new PersistDynamicValueContract();
		dynamicValue.fieldIdSigned = '1';
		dynamicValue.type = DynamicValueTypeContract.Text;
		dynamicValue.textValue = 'some text';

		const dynamicValue2 = new PersistDynamicValueContract();
		dynamicValue2.fieldIdSigned = '2';
		dynamicValue2.type = DynamicValueTypeContract.SingleSelection;
		dynamicValue2.singleSelectionKey = 1;

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([dynamicValue, dynamicValue2], [], 100);

		expect(dynamicReturn).toEqual({
			errorResult: [
				new BusinessValidation({
					code: '10201',
					message: 'Value type mismatch for testDynamic field.',
				}),
				new BusinessValidation({
					code: '10201',
					message: 'Value type mismatch for Sample text field.',
				}),
			],
		} as MapRequestOptionalResult);
	});

	it(`should not map request fields that don't match ids`, async () => {
		DynamicFieldsServiceMock.getServiceFields.mockImplementation(() => Promise.resolve([createTextField()]));

		const dynamicValue = new PersistDynamicValueContract();
		dynamicValue.fieldIdSigned = '5';
		dynamicValue.type = DynamicValueTypeContract.Text;
		dynamicValue.textValue = 'some text';

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([dynamicValue], [], 100);

		expect(dynamicReturn).toEqual({
			errorResult: [
				new BusinessValidation({
					code: '10202',
					message: 'Sample text field is required.',
				}),
			],
		} as MapRequestOptionalResult);
	});

	it(`should validate char limit for text dynamic fields`, async () => {
		DynamicFieldsServiceMock.getServiceFields.mockImplementation(() => Promise.resolve([createTextField()]));

		const dynamicValue = new PersistDynamicValueContract();
		dynamicValue.fieldIdSigned = '2';
		dynamicValue.type = DynamicValueTypeContract.Text;
		dynamicValue.textValue = 'some very long string, some very long string, some very long string';

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([dynamicValue], [], 100);

		expect(dynamicReturn).toEqual({
			errorResult: [
				new BusinessValidation({
					code: '10250',
					message: 'Sample text word limit is 15 characters.',
				}),
			],
		} as MapRequestOptionalResult);
	});

	it(`[DateOnly] should map date`, async () => {
		DynamicFieldsServiceMock.getServiceFields.mockImplementation(() =>
			Promise.resolve([createDateField({ isMandatory: false })]),
		);
		const dynamicValue = new PersistDynamicValueContract();
		dynamicValue.fieldIdSigned = '3';
		dynamicValue.type = DynamicValueTypeContract.DateOnly;
		dynamicValue.dateOnlyValue = '2021-10-15';

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([dynamicValue], [], 100);
		expect(dynamicReturn).toEqual({
			result: [
				{
					dateOnlyValue: '2021-10-15',
					fieldId: 3,
					fieldName: 'Sample date',
					type: 'DateOnly',
					origin: { originType: 'bookingsg' },
				},
			],
		} as MapRequestOptionalResult);
	});

	it(`[DateOnly] should map empty date when field is not mandatory`, async () => {
		DynamicFieldsServiceMock.getServiceFields.mockImplementation(() =>
			Promise.resolve([createDateField({ isMandatory: false })]),
		);
		const dynamicValue = new PersistDynamicValueContract();
		dynamicValue.fieldIdSigned = '3';
		dynamicValue.type = DynamicValueTypeContract.DateOnly;
		dynamicValue.dateOnlyValue = undefined;

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([dynamicValue], [], 100);
		expect(dynamicReturn).toEqual({
			result: [
				{
					fieldId: 3,
					fieldName: 'Sample date',
					origin: { originType: 'bookingsg' },
				},
			],
		} as MapRequestOptionalResult);
	});

	it(`[DateOnly] should NOT map empty date when field is mandatory`, async () => {
		DynamicFieldsServiceMock.getServiceFields.mockImplementation(() =>
			Promise.resolve([createDateField({ isMandatory: true })]),
		);
		const dynamicValue = new PersistDynamicValueContract();
		dynamicValue.fieldIdSigned = '3';
		dynamicValue.type = DynamicValueTypeContract.DateOnly;
		dynamicValue.dateOnlyValue = undefined;

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([dynamicValue], [], 100);
		expect(dynamicReturn).toEqual({
			errorResult: [
				new BusinessValidation({
					code: '10202',
					message: 'Sample date field is required.',
				}),
			],
		} as MapRequestOptionalResult);
	});

	it(`[DateOnly] should return validation when date is invalid and field is mandatory`, async () => {
		DynamicFieldsServiceMock.getServiceFields.mockImplementation(() =>
			Promise.resolve([createDateField({ isMandatory: true })]),
		);
		const dynamicValue = new PersistDynamicValueContract();
		dynamicValue.fieldIdSigned = '3';
		dynamicValue.type = DynamicValueTypeContract.DateOnly;
		dynamicValue.dateOnlyValue = 'ASD';

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([dynamicValue], [], 100);
		expect(dynamicReturn).toEqual({
			errorResult: [
				new BusinessValidation({
					code: '10260',
					message: 'Sample date value is not a valid date.',
				}),
			],
		} as MapRequestOptionalResult);
	});

	it(`[DateOnly] should  return validation when date is invalid and field is NOT mandatory`, async () => {
		DynamicFieldsServiceMock.getServiceFields.mockImplementation(() =>
			Promise.resolve([createDateField({ isMandatory: false })]),
		);
		const dynamicValue = new PersistDynamicValueContract();
		dynamicValue.fieldIdSigned = '3';
		dynamicValue.type = DynamicValueTypeContract.DateOnly;
		dynamicValue.dateOnlyValue = 'ASD';

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([dynamicValue], [], 100);
		expect(dynamicReturn).toEqual({
			errorResult: [
				new BusinessValidation({
					code: '10260',
					message: 'Sample date value is not a valid date.',
				}),
			],
		} as MapRequestOptionalResult);
	});
});
