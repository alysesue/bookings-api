import { PgClient } from '../../utils/pgClient';
import { populateService } from '../../populate/basic';
import { ServiceResponse } from '../../../src/components/services/service.apicontract';
import { DynamicFieldModel } from '../../../src/components/dynamicFields/dynamicFields.apicontract';
import { deleteDynamicField, getDynamicFields, postSelectListDynamicField, postTextDynamicField } from './common';

describe('Dynamic Fields functional tests', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';

	let service: ServiceResponse;
	let serviceId: number;
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
		serviceId = service.id;

		done();
	});

	it('should delete text dynamic field', async () => {
		const addedResponse = await postTextDynamicField({ serviceId: service.id });
		expect((await getDynamicFields({ serviceId })).length).toEqual(1);

		const field = addedResponse.body.data as DynamicFieldModel;

		const response = await deleteDynamicField({
			serviceId: service.id,
			idSigned: field.idSigned,
		});

		expect(response.statusCode).toBe(204);
		expect((await getDynamicFields({ serviceId })).length).toEqual(0);
	});

	it('should delete select list dynamic field', async () => {
		const addedResponse = await postSelectListDynamicField({ serviceId: service.id });
		expect((await getDynamicFields({ serviceId })).length).toEqual(1);

		const field = addedResponse.body.data as DynamicFieldModel;

		const response = await deleteDynamicField({
			serviceId: service.id,
			idSigned: field.idSigned,
		});

		expect(response.statusCode).toBe(204);
		expect((await getDynamicFields({ serviceId })).length).toEqual(0);
	});

	it('should only delete specified field', async () => {
		const textResponse = await postTextDynamicField({ serviceId: service.id });
		const selectListResponse = await postSelectListDynamicField({ serviceId: service.id });
		const textField = textResponse.body.data as DynamicFieldModel;
		const selectListField = selectListResponse.body.data as DynamicFieldModel;

		expect((await getDynamicFields({ serviceId })).length).toEqual(2);
		await deleteDynamicField({ serviceId: service.id, idSigned: selectListField.idSigned });

		const fields = await getDynamicFields({ serviceId });
		expect(fields.length).toEqual(1);
		expect(fields[0].idSigned).toEqual(textField.idSigned);
	});
});