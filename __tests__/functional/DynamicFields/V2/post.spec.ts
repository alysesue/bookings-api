import { PgClient } from '../../../utils/pgClient';
import { DynamicFieldModel, TextFieldType } from '../../../../src/components/dynamicFields/dynamicFields.apicontract';
import { getDynamicFields, postSelectListDynamicField, postTextDynamicField } from './common';
import { ServiceResponseV2 } from '../../../../src/components/services/service.apicontract';
import { postService } from '../../../populate/V2/services';

describe('Dynamic Fields functional tests', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';
	const NAME_SERVICE_2 = 'service2';

	let service: ServiceResponseV2;
	let service2: ServiceResponseV2;

	afterAll(async () => {
		await pgClient.cleanAllTables();
		await pgClient.close();
	});

	beforeEach(async () => {
		await pgClient.cleanAllTables();

		service = await postService({
			name: NAME_SERVICE_1,
		});
		service2 = await postService({
			name: NAME_SERVICE_2,
		});
	});

	it('should add text dynamic field with isMandatory = undefined set to default false', async () => {
		const response = await postTextDynamicField({ serviceId: service.id }, undefined);
		expect(response.statusCode).toBe(201);

		const field = response.body.data as DynamicFieldModel;
		expect(field).toEqual({
			idSigned: field.idSigned,
			isMandatory: false,
			name: 'notes',
			textField: {
				charLimit: 15,
				inputType: TextFieldType.SingleLine,
			},
			type: 'TextField',
		});
	});

	it('should add text area dynamic field with isMandatory = undefined set to default false', async () => {
		const response = await postTextDynamicField({ serviceId: service.id }, undefined, TextFieldType.TextArea);
		expect(response.statusCode).toBe(201);

		const field = response.body.data as DynamicFieldModel;
		expect(field).toEqual({
			idSigned: field.idSigned,
			isMandatory: false,
			name: 'notes',
			textField: {
				charLimit: 15,
				inputType: TextFieldType.TextArea,
			},
			type: 'TextField',
		});
	});

	it('should add select list dynamic field with isMandatory = null set to default false', async () => {
		const response = await postSelectListDynamicField({ serviceId: service.id }, null);
		expect(response.statusCode).toBe(201);

		const field = response.body.data as DynamicFieldModel;
		expect(field).toEqual({
			idSigned: field.idSigned,
			isMandatory: false,
			name: 'options',
			selectList: {
				options: [
					{ key: 1, value: 'A' },
					{ key: 2, value: 'B' },
				],
			},
			type: 'SelectList',
		});
	});

	it('should add fields to different services', async () => {
		// service 1
		await postTextDynamicField({ serviceId: service.id }, true);
		await postSelectListDynamicField({ serviceId: service.id }, true);
		// service 2
		await postTextDynamicField({ serviceId: service2.id }, true);

		expect((await getDynamicFields({ serviceId: service.id })).length).toEqual(2);
		expect((await getDynamicFields({ serviceId: service2.id })).length).toEqual(1);
	});
});
