import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { PgClient } from '../../utils/pgClient';
import { populateService } from '../../Populate/basic';

describe('Tests endpoint and populate data', () => {
	const SP_NAME = 'sp';
	const SP_EMAIL = `${SP_NAME}@govtech.com`;
	const SP_PHONE = '1800 944 7853';
	const pgClient = new PgClient();
	let service;

	beforeAll(async () => {
		await pgClient.cleanAllTables();
	});

	afterAll(async () => {
		await pgClient.close();
	});

	beforeEach(async () => {
		service = await populateService({});
	});

	afterEach(async () => {
		await pgClient.cleanAllTables();
	});

	it('Post & Get serviceProvider', async () => {
		const portResponse = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).post(
			'/service-providers',
			{
				body: {
					serviceProviders: [
						{
							name: SP_NAME,
							email: SP_EMAIL,
							phone: SP_PHONE,
						},
					],
				},
			},
		);
		expect(portResponse.statusCode).toEqual(204);

		const getResponse = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).get(
			'/service-providers',
		);
		expect(getResponse.statusCode).toEqual(200);
		expect(getResponse.body.data[0].name).toEqual(SP_NAME);
		expect(getResponse.body.data[0].email).toEqual(SP_EMAIL);
		expect(getResponse.body.data[0].phone).toEqual(SP_PHONE);
	});
});
