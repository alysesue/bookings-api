import { Container } from 'typescript-ioc';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { infoRawMock } from '../__mocks__/infoRaw.mock';
import { MyInfoResponseMapper } from '../myInfoResponseMapper';
import { MyInfoDynamicField } from '../../../models';
import { MyInfoFieldType } from '../../../models/entities/myInfoFieldType';

beforeAll(() => {
	Container.bind(UserContext).to(UserContextMock);
});

describe('MyInfo response mapper', () => {
	beforeEach(() => {
		jest.resetAllMocks();

		UserContextMock.getMyInfo.mockReturnValue(Promise.resolve(undefined));
	});

	it('should map all field types when empty', async () => {
		const enumValues = Object.values(MyInfoFieldType);
		for (const myInfoFieldType of enumValues) {
			const field = MyInfoDynamicField.create(1, 'Label', myInfoFieldType);
			field.id = 2;

			const mapper = Container.get(MyInfoResponseMapper);
			const result = await mapper.mapOriginalValue(field);

			expect(result).toBe(undefined);
		}
	});

	it('should map nationality', async () => {
		UserContextMock.getMyInfo.mockReturnValue(Promise.resolve(infoRawMock('S2312382G')));
		const field = MyInfoDynamicField.create(1, 'Label', MyInfoFieldType.nationality);
		field.id = 2;

		const mapper = Container.get(MyInfoResponseMapper);
		const result = await mapper.mapOriginalValue(field);

		expect(result).toEqual({
			SingleSelectionKey: 'SG',
			SingleSelectionValue: 'SINGAPORE CITIZEN',
			fieldId: 2,
			fieldName: 'Label',
			myInfoFieldType: 'nationality',
			type: 'SingleSelection',
			origin: {
				myInfoOrigin: {
					classification: 'C',
					lastupdated: '2019-03-26',
					source: '1',
				},
				originType: 'myinfo',
			},
		});
	});

	it('should map dob', async () => {
		UserContextMock.getMyInfo.mockReturnValue(Promise.resolve(infoRawMock('S2312382G')));
		const field = MyInfoDynamicField.create(1, 'Label', MyInfoFieldType.dob);
		field.id = 2;

		const mapper = Container.get(MyInfoResponseMapper);
		const result = await mapper.mapOriginalValue(field);

		expect(result).toEqual({
			dateOnlyValue: '1958-05-17',
			fieldId: 2,
			fieldName: 'Label',
			myInfoFieldType: 'dob',
			type: 'DateOnly',
			origin: {
				myInfoOrigin: {
					classification: 'C',
					lastupdated: '2019-03-26',
					source: '1',
				},
				originType: 'myinfo',
			},
		});
	});

	it('should map sex', async () => {
		UserContextMock.getMyInfo.mockReturnValue(Promise.resolve(infoRawMock('S2312382G')));
		const field = MyInfoDynamicField.create(1, 'Label', MyInfoFieldType.sex);
		field.id = 2;

		const mapper = Container.get(MyInfoResponseMapper);
		const result = await mapper.mapOriginalValue(field);

		expect(result).toEqual({
			SingleSelectionKey: 'M',
			SingleSelectionValue: 'MALE',
			fieldId: 2,
			fieldName: 'Label',
			myInfoFieldType: 'sex',
			type: 'SingleSelection',
			origin: {
				myInfoOrigin: {
					classification: 'C',
					lastupdated: '2019-03-26',
					source: '1',
				},
				originType: 'myinfo',
			},
		});
	});

	it('should map regadd_postal', async () => {
		UserContextMock.getMyInfo.mockReturnValue(Promise.resolve(infoRawMock('S2312382G')));
		const field = MyInfoDynamicField.create(1, 'Label', MyInfoFieldType.regadd_postal);
		field.id = 2;

		const mapper = Container.get(MyInfoResponseMapper);
		const result = await mapper.mapOriginalValue(field);

		expect(result).toEqual({
			fieldId: 2,
			fieldName: 'Label',
			myInfoFieldType: 'regadd_postal',
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
		});
	});

	it('should map residentialstatus', async () => {
		UserContextMock.getMyInfo.mockReturnValue(Promise.resolve(infoRawMock('S2312382G')));
		const field = MyInfoDynamicField.create(1, 'Label', MyInfoFieldType.residentialstatus);
		field.id = 2;

		const mapper = Container.get(MyInfoResponseMapper);
		const result = await mapper.mapOriginalValue(field);

		expect(result).toEqual({
			SingleSelectionKey: 'C',
			SingleSelectionValue: 'CITIZEN',
			fieldId: 2,
			fieldName: 'Label',
			myInfoFieldType: 'residentialstatus',
			type: 'SingleSelection',
			origin: {
				myInfoOrigin: {
					classification: 'C',
					lastupdated: '2019-03-26',
					source: '1',
				},
				originType: 'myinfo',
			},
		});
	});
});
