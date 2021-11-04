import { Container } from 'typescript-ioc';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { DynamicValueJsonModel, DynamicValueType, InformationOriginType } from '../../../models/entities/jsonModels';
import { DynamicValuesMapper, DynamicValuesRequestMapper, MapRequestOptionalResult } from '../dynamicValues.mapper';
import { DynamicValueTypeContract, PersistDynamicValueContract } from '../dynamicValues.apicontract';
import { DynamicFieldsService } from '../dynamicFields.service';
import { DynamicFieldsServiceMock } from '../__mocks__/dynamicFields.service.mock';
import {
	DateOnlyDynamicField,
	MyInfoDynamicField,
	Organisation,
	SelectListDynamicField,
	TextDynamicField,
	User,
} from '../../../models';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { ContainerContextHolder } from '../../../infrastructure/containerContext';
import { MyInfoFieldType } from '../../../models/entities/myInfoFieldType';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import * as uuid from 'uuid';
import { MyInfoMetadataFactory } from '../../myInfo/myInfoMetadata';
import { MyInfoMetadataFactoryMock } from '../../myInfo/__mocks__/myInfoMetadata.mock';
import { MyInfoResponseMapper } from '../../myInfo/myInfoResponseMapper';
import { MyInfoResponseMapperMock } from '../../myInfo/__mocks__/myInfoResponseMapper.mock';

jest.mock('../../myInfo/myInfoResponseMapper', () => {
	class MyInfoResponseMapper {}
	return {
		MyInfoResponseMapper,
	};
});

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
	Container.bind(MyInfoMetadataFactory).to(MyInfoMetadataFactoryMock);
	Container.bind(MyInfoResponseMapper).to(MyInfoResponseMapperMock);
	ContainerContextHolder.registerInContainer();
});

describe('[MyInfo] dynamicFields/dynamicValues.mapper', () => {
	const myInfoFieldTypeMock = MyInfoFieldType.regadd_postal; // This type shouldn't matter as we are mocking the metadata
	const myInfoFieldMock = MyInfoDynamicField.create(1, 'Some MyInfo field', myInfoFieldTypeMock);
	myInfoFieldMock.id = 7;

	const createTextMetadata = () => {
		const field = TextDynamicField.create(1, 'Some MyInfo field', 10, false);
		field.id = 7;
		return field;
	};

	const createSelectListMetadata = () => {
		const options = [
			{ key: 'A', value: '111122' },
			{ key: 'B', value: '77755' },
		];
		const field = SelectListDynamicField.create(1, 'Some MyInfo field', options, false);
		field.id = 7;
		return field;
	};

	const createDateOnlyMetadata = () => {
		const field = DateOnlyDynamicField.create(1, 'Some MyInfo field', false);
		field.id = 7;
		return field;
	};

	const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');

	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
		agencyUserId: 'ABC123',
	});
	const organisation = Organisation.create('org', 1);
	const orgAuthGroup = new OrganisationAdminAuthGroup(adminMock, [organisation]);

	const anonymousUser = User.createAnonymousUser({
		createdAt: new Date(),
		trackingId: uuid.v4(),
	});

	const otpGroup = new AnonymousAuthGroup(anonymousUser, undefined, {
		mobileNo: '+61424000000',
	});

	beforeEach(() => {
		jest.resetAllMocks();

		IdHasherMock.encode.mockImplementation((id: number) => id.toString());
		IdHasherMock.decode.mockImplementation((id: string) => Number.parseInt(id, 10));

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new CitizenAuthGroup(singpassMock)]));

		DynamicFieldsServiceMock.getServiceFields.mockImplementation(() => Promise.resolve([myInfoFieldMock]));
		MyInfoMetadataFactoryMock.isCitizenReadonly.mockReturnValue(true);
		MyInfoMetadataFactoryMock.getFieldMetadata.mockReturnValue(createTextMetadata());
		MyInfoResponseMapperMock.mapOriginalValue.mockReturnValue(
			Promise.resolve({
				fieldId: 7,
				fieldName: 'Some MyInfo field',
				myInfoFieldType: myInfoFieldTypeMock,
				textValue: '460548',
				type: 'Text',
				origin: {
					myInfoOrigin: {
						classification: 'C',
						lastupdated: '2019-03-26',
						source: '1',
					},
					originType: 'myinfo',
				},
			} as DynamicValueJsonModel),
		);

		MyInfoResponseMapperMock.isOriginReadonly.mockReturnValue(false);
	});

	it('[Response] should map myInfo dynamic field value', async () => {
		const dynamicValueJson = {
			fieldId: 1,
			fieldName: 'testname',
			myInfoFieldType: myInfoFieldTypeMock,
			type: DynamicValueType.Text,
			textValue: 'textValue',
		} as DynamicValueJsonModel;

		const mapper = Container.get(DynamicValuesMapper);
		const dynamicReturn = mapper.mapDynamicValuesModel([dynamicValueJson]);
		expect(dynamicReturn).toEqual([
			{
				fieldIdSigned: '1',
				fieldName: 'testname',
				myInfoFieldType: myInfoFieldTypeMock,
				type: DynamicValueType.Text,
				textValue: 'textValue',
			},
		]);
	});

	it('[Response] should map myInfo dynamic field value to string ', async () => {
		const dynamicValueJson = {
			fieldId: 1,
			fieldName: 'testname',
			myInfoFieldType: myInfoFieldTypeMock,
			type: DynamicValueType.Text,
			textValue: 'textValue',
		} as DynamicValueJsonModel;

		const mapper = Container.get(DynamicValuesMapper);
		const str = mapper.getValueAsString(dynamicValueJson);
		expect(str).toEqual('textValue');
	});

	it(`should map New value from MyInfo if user authentication is singpass`, async () => {
		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([], [], 100);

		expect(dynamicReturn).toEqual({
			result: [
				{
					fieldId: 7,
					fieldName: 'Some MyInfo field',
					myInfoFieldType: myInfoFieldTypeMock,
					textValue: '460548',
					type: 'Text',
					origin: {
						myInfoOrigin: {
							classification: 'C',
							lastupdated: '2019-03-26',
							source: '1',
						},
						originType: 'myinfo',
					},
				},
			],
		} as MapRequestOptionalResult);

		expect(DynamicFieldsServiceMock.getServiceFields).toBeCalled();
		expect(MyInfoMetadataFactoryMock.isCitizenReadonly).toBeCalled();
	});

	it(`should map New value from request when field is editable (Text field)`, async () => {
		MyInfoMetadataFactoryMock.getFieldMetadata.mockReturnValue(createTextMetadata());
		MyInfoMetadataFactoryMock.isCitizenReadonly.mockReturnValue(false);

		const dynamicValue = new PersistDynamicValueContract();
		dynamicValue.fieldIdSigned = '7';
		dynamicValue.type = DynamicValueTypeContract.Text;
		dynamicValue.textValue = '123456';

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([dynamicValue], [], 100);

		expect(dynamicReturn).toEqual({
			result: [
				{
					fieldId: 7,
					fieldName: 'Some MyInfo field',
					myInfoFieldType: myInfoFieldTypeMock,
					textValue: '123456',
					type: 'Text',
					origin: { originType: 'bookingsg' },
				},
			],
		} as MapRequestOptionalResult);

		expect(DynamicFieldsServiceMock.getServiceFields).toBeCalled();
		expect(MyInfoMetadataFactoryMock.isCitizenReadonly).toBeCalled();
		expect(MyInfoMetadataFactoryMock.getFieldMetadata).toBeCalled();
	});

	it(`should map New value from request when field is editable (Select list field)`, async () => {
		MyInfoMetadataFactoryMock.getFieldMetadata.mockReturnValue(createSelectListMetadata());
		MyInfoMetadataFactoryMock.isCitizenReadonly.mockReturnValue(false);

		const dynamicValue = new PersistDynamicValueContract();
		dynamicValue.fieldIdSigned = '7';
		dynamicValue.type = DynamicValueTypeContract.SingleSelection;
		dynamicValue.singleSelectionKey = 'A';

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([dynamicValue], [], 100);

		expect(dynamicReturn).toEqual({
			result: [
				{
					SingleSelectionKey: 'A',
					SingleSelectionValue: '111122',
					fieldId: 7,
					fieldName: 'Some MyInfo field',
					myInfoFieldType: myInfoFieldTypeMock,
					type: 'SingleSelection',
					origin: { originType: 'bookingsg' },
				},
			],
		} as MapRequestOptionalResult);
	});

	it(`should map New value from request when field is editable (Date field)`, async () => {
		MyInfoMetadataFactoryMock.getFieldMetadata.mockReturnValue(createDateOnlyMetadata());
		MyInfoMetadataFactoryMock.isCitizenReadonly.mockReturnValue(false);

		const dynamicValue = new PersistDynamicValueContract();
		dynamicValue.fieldIdSigned = '7';
		dynamicValue.type = DynamicValueTypeContract.DateOnly;
		dynamicValue.dateOnlyValue = '2021-02-20';

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([dynamicValue], [], 100);

		expect(dynamicReturn).toEqual({
			result: [
				{
					dateOnlyValue: '2021-02-20',
					fieldId: 7,
					fieldName: 'Some MyInfo field',
					myInfoFieldType: myInfoFieldTypeMock,
					type: 'DateOnly',
					origin: { originType: 'bookingsg' },
				},
			],
		} as MapRequestOptionalResult);
	});

	it(`should NOT map New value from MyInfo if user authentication is singpass and myinfo is not available`, async () => {
		MyInfoResponseMapperMock.mapOriginalValue.mockReturnValue(Promise.resolve(undefined));

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([], [], 100);

		expect(dynamicReturn).toEqual({ result: [] } as MapRequestOptionalResult);
	});

	it(`should override New value with MyInfo if user authentication is singpass`, async () => {
		const dynamicValue = new PersistDynamicValueContract();
		dynamicValue.fieldIdSigned = '7';
		dynamicValue.type = DynamicValueTypeContract.Text;
		dynamicValue.textValue = '123456';

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([dynamicValue], [], 100);

		expect(dynamicReturn).toEqual({
			result: [
				{
					fieldId: 7,
					fieldName: 'Some MyInfo field',
					myInfoFieldType: myInfoFieldTypeMock,
					textValue: '460548',
					type: 'Text',
					origin: {
						myInfoOrigin: {
							classification: 'C',
							lastupdated: '2019-03-26',
							source: '1',
						},
						originType: 'myinfo',
					},
				},
			],
		} as MapRequestOptionalResult);
	});

	it(`when updating, should override New value with MyInfo if user authentication is singpass`, async () => {
		const existingValue: DynamicValueJsonModel = {
			fieldId: 7,
			fieldName: 'Some MyInfo field',
			myInfoFieldType: myInfoFieldTypeMock,
			type: DynamicValueType.Text,
			textValue: '123456',
		};

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([], [existingValue], 100);

		expect(dynamicReturn).toEqual({
			result: [
				{
					fieldId: 7,
					fieldName: 'Some MyInfo field',
					myInfoFieldType: myInfoFieldTypeMock,
					textValue: '460548',
					type: 'Text',
					origin: {
						myInfoOrigin: {
							classification: 'C',
							lastupdated: '2019-03-26',
							source: '1',
						},
						originType: 'myinfo',
					},
				},
			],
		} as MapRequestOptionalResult);
	});

	it(`[Admin] should keep existing value if user authentication is Admin (SA/SP), and value is readonly`, async () => {
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([orgAuthGroup]));

		const existingValue: DynamicValueJsonModel = {
			fieldId: 7,
			fieldName: 'Some MyInfo field',
			myInfoFieldType: myInfoFieldTypeMock,
			type: DynamicValueType.Text,
			textValue: '123456',
		};

		const newValue: PersistDynamicValueContract = {
			fieldIdSigned: '7',
			type: DynamicValueTypeContract.Text,
			textValue: 'ABCD',
		};

		MyInfoResponseMapperMock.isOriginReadonly.mockReturnValue(true);

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([newValue], [existingValue], 100);

		expect(MyInfoResponseMapperMock.isOriginReadonly).toBeCalled();
		expect(dynamicReturn).toEqual({
			result: [
				{
					fieldId: 7,
					fieldName: 'Some MyInfo field',
					myInfoFieldType: myInfoFieldTypeMock,
					textValue: '123456',
					type: 'Text',
				},
			],
		} as MapRequestOptionalResult);
	});

	it('[Admin] should override existing value if user authentication is Admin (SA/SP), and value is NOT readonly', async () => {
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([orgAuthGroup]));

		const existingValue: DynamicValueJsonModel = {
			fieldId: 7,
			fieldName: 'Some MyInfo field',
			myInfoFieldType: myInfoFieldTypeMock,
			type: DynamicValueType.Text,
			textValue: '123456',
		};

		const newValue: PersistDynamicValueContract = {
			fieldIdSigned: '7',
			type: DynamicValueTypeContract.Text,
			textValue: 'ABCD',
		};

		MyInfoResponseMapperMock.isOriginReadonly.mockReturnValue(false);

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([newValue], [existingValue], 100);

		expect(MyInfoResponseMapperMock.isOriginReadonly).toBeCalled();
		expect(dynamicReturn).toEqual({
			result: [
				{
					fieldId: 7,
					fieldName: 'Some MyInfo field',
					myInfoFieldType: myInfoFieldTypeMock,
					textValue: 'ABCD',
					type: 'Text',
					origin: {
						originType: 'bookingsg',
					},
				},
			],
		} as MapRequestOptionalResult);
	});

	it(`[Admin] should add new value if user authentication is Admin (SA/SP), and there's NO value, even if the field is citizenReadonly`, async () => {
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([orgAuthGroup]));

		const newValue: PersistDynamicValueContract = {
			fieldIdSigned: '7',
			type: DynamicValueTypeContract.Text,
			textValue: 'ABCD',
		};

		MyInfoMetadataFactoryMock.isCitizenReadonly.mockReturnValue(true);

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([newValue], [], 100);

		// expect(MyInfoResponseMapperMock.isOriginReadonly).not.toBeCalled();
		expect(MyInfoMetadataFactoryMock.isCitizenReadonly).toBeCalled();
		expect(dynamicReturn).toEqual({
			result: [
				{
					fieldId: 7,
					fieldName: 'Some MyInfo field',
					myInfoFieldType: myInfoFieldTypeMock,
					textValue: 'ABCD',
					type: 'Text',
					origin: {
						originType: 'bookingsg',
					},
				},
			],
		} as MapRequestOptionalResult);
	});

	it(`should keep existing value if user is OTP and original value was mapped from MyInfo`, async () => {
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(anonymousUser));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([otpGroup]));

		const existingValue: DynamicValueJsonModel = {
			fieldId: 7,
			fieldName: 'Some MyInfo field',
			myInfoFieldType: myInfoFieldTypeMock,
			type: DynamicValueType.Text,
			textValue: '123456',
			origin: {
				myInfoOrigin: {
					classification: 'C',
					lastupdated: '2019-03-26',
					source: '1',
				},
				originType: InformationOriginType.MyInfo,
			},
		};

		MyInfoResponseMapperMock.isOriginReadonly.mockReturnValue(true);

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([], [existingValue], 100);

		expect(dynamicReturn).toEqual({
			result: [
				{
					fieldId: 7,
					fieldName: 'Some MyInfo field',
					myInfoFieldType: myInfoFieldTypeMock,
					textValue: '123456',
					type: 'Text',
					origin: {
						myInfoOrigin: {
							classification: 'C',
							lastupdated: '2019-03-26',
							source: '1',
						},
						originType: 'myinfo',
					},
				},
			],
		} as MapRequestOptionalResult);
	});

	it(`[Updating] should update myInfo values from MyInfo when field is readonly (Singpass user)`, async () => {
		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.updateMyInfoDynamicFromUser([], 100);

		expect(dynamicReturn).toEqual([
			{
				fieldId: 7,
				fieldName: 'Some MyInfo field',
				myInfoFieldType: myInfoFieldTypeMock,
				textValue: '460548',
				type: 'Text',
				origin: {
					myInfoOrigin: {
						classification: 'C',
						lastupdated: '2019-03-26',
						source: '1',
					},
					originType: 'myinfo',
				},
			},
		]);

		expect(DynamicFieldsServiceMock.getServiceFields).toBeCalled();
		expect(MyInfoMetadataFactoryMock.isCitizenReadonly).toBeCalled();
	});

	it(`[Updating] should NOT update myInfo values from MyInfo when user is not singpass`, async () => {
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([orgAuthGroup]));

		const mapper = Container.get(DynamicValuesRequestMapper);
		const existingValue: DynamicValueJsonModel = {
			fieldId: 7,
			fieldName: 'Some MyInfo field',
			myInfoFieldType: myInfoFieldTypeMock,
			textValue: 'Existing Value',
			type: DynamicValueType.Text,
		};
		const dynamicReturn = await mapper.updateMyInfoDynamicFromUser([existingValue], 100);

		expect(dynamicReturn).toEqual([existingValue]);
	});

	it(`[Updating] should NOT update myInfo values from MyInfo when field is editable and some value exists`, async () => {
		MyInfoMetadataFactoryMock.isCitizenReadonly.mockReturnValue(false);

		const existingValues: DynamicValueJsonModel[] = [
			{
				fieldId: 7,
				fieldName: 'Some MyInfo field',
				myInfoFieldType: myInfoFieldTypeMock,
				textValue: 'Existing Value',
				type: DynamicValueType.Text,
			},
		];

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.updateMyInfoDynamicFromUser(existingValues, 100);

		expect(dynamicReturn).toEqual(existingValues);
	});

	it(`[Updating] should update myInfo values from MyInfo and keep other values`, async () => {
		const simpleTextField = TextDynamicField.create(1, 'Notes', 50, false);
		simpleTextField.id = 12;

		DynamicFieldsServiceMock.getServiceFields.mockImplementation(() =>
			Promise.resolve([myInfoFieldMock, simpleTextField]),
		);
		const existingMyInfoValue: DynamicValueJsonModel = {
			fieldId: 7,
			fieldName: 'Some MyInfo field',
			myInfoFieldType: myInfoFieldTypeMock,
			textValue: 'Existing Value',
			type: DynamicValueType.Text,
		};
		const existingSimpleValue: DynamicValueJsonModel = {
			fieldId: 12,
			fieldName: 'Notes',
			textValue: 'My notes',
			type: DynamicValueType.Text,
		};

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.updateMyInfoDynamicFromUser([existingMyInfoValue, existingSimpleValue], 100);

		expect(dynamicReturn).toEqual([
			{
				fieldId: 7,
				fieldName: 'Some MyInfo field',
				myInfoFieldType: myInfoFieldTypeMock,
				textValue: '460548',
				type: 'Text',
				origin: {
					myInfoOrigin: {
						classification: 'C',
						lastupdated: '2019-03-26',
						source: '1',
					},
					originType: 'myinfo',
				},
			},
			existingSimpleValue,
		]);
	});
	it('[deleting] As an admin, it should delete myInfo value if field value is empty and field is not read only', async () => {
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([orgAuthGroup]));

		const existingValue: DynamicValueJsonModel = {
			fieldId: 7,
			fieldName: 'Some MyInfo field',
			myInfoFieldType: myInfoFieldTypeMock,
			type: DynamicValueType.Text,
			textValue: '123456',
		};

		MyInfoResponseMapperMock.isOriginReadonly.mockReturnValue(false);

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([], [existingValue], 100);

		expect(MyInfoResponseMapperMock.isOriginReadonly).toBeCalled();
		expect(dynamicReturn).toEqual({
			result: [],
		} as MapRequestOptionalResult);
	});
	it('[deleting] As a singpass user, it should delete myInfo value if field value is empty and field is not read only', async () => {
		const existingValue: DynamicValueJsonModel = {
			fieldId: 7,
			fieldName: 'Some MyInfo field',
			myInfoFieldType: myInfoFieldTypeMock,
			type: DynamicValueType.Text,
			textValue: '123456',
		};

		MyInfoResponseMapperMock.isOriginReadonly.mockReturnValue(false);
		MyInfoMetadataFactoryMock.isCitizenReadonly.mockReturnValue(false);

		const mapper = Container.get(DynamicValuesRequestMapper);
		const dynamicReturn = await mapper.mapDynamicValues([], [existingValue], 100);

		expect(MyInfoResponseMapperMock.isOriginReadonly).toBeCalled();
		expect(dynamicReturn).toEqual({
			result: [],
		} as MapRequestOptionalResult);
	});
});
