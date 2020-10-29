import { AdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { PgClient } from '../../utils/pgClient';
import { populateService } from '../../Populate/basic';

describe('Tests endpoint and populate data', () => {
	const SP_NAME = 'sp';
	const SP_EMAIL = `${SP_NAME}@govtech.com`;
	const SP_PHONE = '1800 944 7853';
	const pgClient = new PgClient();
	let serviceId;

	beforeAll(async () => {
		await pgClient.cleanAllTables();
		serviceId = await populateService({});
	});

	afterAll(async () => {
		await pgClient.cleanAllTables();
		await pgClient.close();
	});
	// TODO: remove google calendar because quickly bloque creation service Provider
	xit('Post serviceProvider', async () => {
		const response = await AdminRequestEndpointSG.create({ serviceId: serviceId! }).post('/service-providers', {
			body: {
				serviceProviders: [
					{
						name: SP_NAME,
						email: SP_EMAIL,
						phone: SP_PHONE,
					},
				],
			},
		});

		expect(response.statusCode).toEqual(204);
	});

	xit('Get serviceProvider', async () => {
		const response = await AdminRequestEndpointSG.create({ serviceId: serviceId! }).get('/service-providers');
		expect(response.statusCode).toEqual(200);
		expect(JSON.parse(response.body).data[0].name).toEqual(SP_NAME);
		expect(JSON.parse(response.body).data[0].email).toEqual(SP_EMAIL);
		expect(JSON.parse(response.body).data[0].phone).toEqual(SP_PHONE);
	});
});
