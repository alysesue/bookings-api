import { PgClient } from '../../../utils/pgClient';
import {
	DynamicFieldModel,
	DynamicFieldType,
} from '../../../../src/components/dynamicFields/dynamicFields.apicontract';
import { postSelectListDynamicField, postTextDynamicField, putDynamicField } from './common';
import { ServiceResponseV2 } from '../../../../src/components/services/service.apicontract';
import { postService } from '../../../populate/V2/services';

describe('Dynamic Fields functional tests', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';

	let service: ServiceResponseV2;

	const putTextDynamicField = async (field: DynamicFieldModel, type?: DynamicFieldType) => {
		return await putDynamicField({
			serviceId: service.id,
			idSigned: field.idSigned,
			params: {
				body: {
					name: 'notes 2',
					type: type ?? 'TextField',
					textField: { charLimit: 20 },
					isMandatory: true,
				},
			},
		});
	};

	afterAll(async () => {
		await pgClient.cleanAllTables();
		await pgClient.close();
	});

	beforeEach(async () => {
		await pgClient.cleanAllTables();

		service = await postService({
			name: NAME_SERVICE_1,
		});
	});

	it('should update text dynamic field (including change to the default value of isMandatory)', async () => {
		const addedResponse = await postTextDynamicField({ serviceId: service.id }, undefined);
		const field = addedResponse.body.data as DynamicFieldModel;

		const response = await putTextDynamicField(field);
		expect(response.statusCode).toBe(200);

		const updatedField = response.body.data as DynamicFieldModel;
		expect(updatedField).toEqual({
			idSigned: field.idSigned,
			isMandatory: true,
			name: 'notes 2',
			textField: {
				charLimit: 20,
			},
			type: 'TextField',
		});
	});

	it('should update text area dynamic field to text dynamic field', async () => {
		const addedResponse = await postTextDynamicField(
			{ serviceId: service.id },
			undefined,
			DynamicFieldType.TextAreaField,
		);
		const field = addedResponse.body.data as DynamicFieldModel;

		const response = await putTextDynamicField(field);
		expect(response.statusCode).toBe(200);

		const updatedField = response.body.data as DynamicFieldModel;
		expect(updatedField).toEqual({
			idSigned: field.idSigned,
			isMandatory: true,
			name: 'notes 2',
			textField: {
				charLimit: 20,
			},
			type: 'TextField',
		});
	});

	it('should update text dynamic field to text area dynamic field', async () => {
		const addedResponse = await postTextDynamicField({ serviceId: service.id }, undefined);
		const field = addedResponse.body.data as DynamicFieldModel;

		const response = await putTextDynamicField(field, DynamicFieldType.TextAreaField);
		expect(response.statusCode).toBe(200);

		const updatedField = response.body.data as DynamicFieldModel;
		expect(updatedField).toEqual({
			idSigned: field.idSigned,
			isMandatory: true,
			name: 'notes 2',
			textField: {
				charLimit: 20,
			},
			type: 'TextAreaField',
		});
	});

	it('should update select list dynamic field (no change to the default value of isMandatory)', async () => {
		const addedResponse = await postSelectListDynamicField({ serviceId: service.id }, undefined);
		const field = addedResponse.body.data as DynamicFieldModel;

		const response = await putDynamicField({
			serviceId: service.id,
			idSigned: field.idSigned,
			params: {
				body: {
					name: 'options 2',
					selectList: {
						options: [
							{ key: 2, value: 'B2' },
							{ key: 3, value: 'C' },
						],
					},
					type: 'SelectList',
				},
			},
		});

		expect(response.statusCode).toBe(200);
		const updatedField = response.body.data as DynamicFieldModel;

		expect(updatedField).toEqual({
			idSigned: field.idSigned,
			isMandatory: false,
			name: 'options 2',
			selectList: {
				options: [
					{ key: 2, value: 'B2' },
					{ key: 3, value: 'C' },
				],
			},
			type: 'SelectList',
		});
	});
});
