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
	});

	afterAll(async () => {
		await pgClient.close();
	});

	beforeEach(async () => {
		serviceId = await populateService({});
	});

	afterEach(async () => {
		await pgClient.cleanAllTables();
	});

	it('Post & Get serviceProvider', async () => {
		const portResponse = await AdminRequestEndpointSG.create({ serviceId: serviceId! }).post('/service-providers', {
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
		expect(portResponse.statusCode).toEqual(204);

		const getResponse = await AdminRequestEndpointSG.create({ serviceId: serviceId! }).get('/service-providers');
		expect(getResponse.statusCode).toEqual(200);
		expect(JSON.parse(getResponse.body).data[0].name).toEqual(SP_NAME);
		expect(JSON.parse(getResponse.body).data[0].email).toEqual(SP_EMAIL);
		expect(JSON.parse(getResponse.body).data[0].phone).toEqual(SP_PHONE);
	});
});
