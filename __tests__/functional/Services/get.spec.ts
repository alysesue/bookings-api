import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { PgClient } from '../../utils/pgClient';
import { populateService } from '../../populate/basic';

describe('Tests endpoint and populate data', () => {
	const SERVICE_NAME = 'Service';
	const pgClient = new PgClient();

	beforeAll(async (done) => {
		await pgClient.cleanAllTables();
		done();
	});
	afterAll(async (done) => {
		await pgClient.close();
		done();
	});

	afterEach(async (done) => {
		await pgClient.cleanAllTables();
		done();
	});

	it('Get service', async () => {
		await populateService({ nameService: SERVICE_NAME });
		const response = await OrganisationAdminRequestEndpointSG.create({}).get('/services');
		expect(response.statusCode).toEqual(200);
		expect(response.body.data[0].name).toEqual(SERVICE_NAME);
	});
});
