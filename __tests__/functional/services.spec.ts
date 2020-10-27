import { AdminRequestEndpointSG } from '../utils/requestEndpointSG';
import { PgClient } from '../utils/pgClient';

describe('Tests endpoint and populate data', () => {
	const SERVICE_NAME = 'Service';
	const SERVICE_NAME_UPDATED = 'ServiceUpdated';
	const pgClient = new PgClient();
	beforeAll(async () => {
		await pgClient.cleanAllTables();
	});

	afterAll(async () => {
		await pgClient.cleanAllTables();
		await pgClient.close();
	});

	it('Post service', async () => {
		const response = await AdminRequestEndpointSG.create().post('/services', { body: { name: SERVICE_NAME } });

		expect(response.statusCode).toEqual(200);
	});

	it('Get service', async () => {
		const response = await AdminRequestEndpointSG.create().get('/services');
		expect(response.statusCode).toEqual(200);
		expect(JSON.parse(response.body).data[0].name).toEqual(SERVICE_NAME);
	});

	it("should update first service's name", async () => {
		const response = await AdminRequestEndpointSG.create().get('/services');
		expect(response.statusCode).toEqual(200);
		const idService = JSON.parse(response.body).data[0].id;

		const response2 = await AdminRequestEndpointSG.create().put(`/services/${idService}`, {
			body: { name: SERVICE_NAME_UPDATED },
		});
		expect(response2.statusCode).toEqual(200);

		const response3 = await AdminRequestEndpointSG.create().get('/services');
		expect(response3.statusCode).toEqual(200);
		expect(JSON.parse(response3.body).data[0].name).toEqual(SERVICE_NAME_UPDATED);
	});
});
