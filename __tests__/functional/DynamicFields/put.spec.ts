import { PgClient } from '../../utils/pgClient';
import { populateService } from '../../populate/basic';
import { ServiceResponse } from '../../../src/components/services/service.apicontract';
import { DynamicFieldModel } from '../../../src/components/dynamicFields/dynamicFields.apicontract';
import { postSelectListDynamicField, postTextDynamicField, putDynamicField } from './common';

describe('Dynamic Fields functional tests', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';

	let service: ServiceResponse;

	afterAll(async (done) => {
		await pgClient.cleanAllTables();
		await pgClient.close();
		done();
	});

	beforeEach(async (done) => {
		await pgClient.cleanAllTables();

		service = await populateService({
			nameService: NAME_SERVICE_1,
		});

		done();
	});

	it('should update text dynamic field', async () => {
		const addedResponse = await postTextDynamicField({ serviceId: service.id });
		const field = addedResponse.body.data as DynamicFieldModel;

		const response = await putDynamicField({
			serviceId: service.id,
			idSigned: field.idSigned,
			params: {
				body: {
					name: 'notes 2',
					type: 'TextField',
					textField: { charLimit: 20 },
				},
			},
		});

		expect(response.statusCode).toBe(200);

		const updatedField = response.body.data as DynamicFieldModel;
		expect(updatedField).toEqual({
			idSigned: field.idSigned,
			name: 'notes 2',
			textField: {
				charLimit: 20,
			},
			type: 'TextField',
		});
	});

	it('should update select list dynamic field', async () => {
		const addedResponse = await postSelectListDynamicField({ serviceId: service.id });
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
