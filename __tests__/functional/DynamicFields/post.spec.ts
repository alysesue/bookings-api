import { PgClient } from '../../utils/pgClient';
import { populateService } from '../../populate/basic';
import { ServiceResponse } from '../../../src/components/services/service.apicontract';
import { DynamicFieldModel } from '../../../src/components/dynamicFields/dynamicFields.apicontract';
import { getDynamicFields, postSelectListDynamicField, postTextDynamicField } from './common';

describe('Dynamic Fields functional tests', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';
	const NAME_SERVICE_2 = 'service2';

	let service: ServiceResponse;
	let service2: ServiceResponse;

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
		service2 = await populateService({
			nameService: NAME_SERVICE_2,
		});

		done();
	});

	it('should add text dynamic field', async () => {
		const response = await postTextDynamicField({ serviceId: service.id });
		expect(response.statusCode).toBe(201);

		const field = response.body.data as DynamicFieldModel;
		expect(field).toEqual({
			idSigned: field.idSigned,
			name: 'notes',
			textField: {
				charLimit: 15,
			},
			type: 'TextField',
		});
	});

	it('should add select list dynamic field', async () => {
		const response = await postSelectListDynamicField({ serviceId: service.id });
		expect(response.statusCode).toBe(201);

		const field = response.body.data as DynamicFieldModel;
		expect(field).toEqual({
			idSigned: field.idSigned,
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
		//service 1
		await postTextDynamicField({ serviceId: service.id });
		await postSelectListDynamicField({ serviceId: service.id });
		//service 2
		await postTextDynamicField({ serviceId: service2.id });

		expect((await getDynamicFields({ serviceId: service.id })).length).toEqual(2);
		expect((await getDynamicFields({ serviceId: service2.id })).length).toEqual(1);
	});
});
