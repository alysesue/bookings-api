import { PgClient } from '../../utils/pgClient';
import { populateService } from '../../populate/basic';
import { DynamicFieldModel } from '../../../src/components/dynamicFields/dynamicFields.apicontract';
import { getDynamicFields, postSelectListDynamicField, postTextDynamicField } from './common';
import {ServiceResponseV1} from "../../../src/components/services/service.apicontract";

describe('Dynamic Fields functional tests', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';
	const NAME_SERVICE_2 = 'service2';

	let service: ServiceResponseV1;
	let service2: ServiceResponseV1;

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
		//service 1
		await postTextDynamicField({ serviceId: service.id }, true);
		await postSelectListDynamicField({ serviceId: service.id }, true);
		//service 2
		await postTextDynamicField({ serviceId: service2.id }, true);

		expect((await getDynamicFields({ serviceId: service.id })).length).toEqual(2);
		expect((await getDynamicFields({ serviceId: service2.id })).length).toEqual(1);
	});
});
