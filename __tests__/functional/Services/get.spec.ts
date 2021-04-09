import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { PgClient } from '../../utils/pgClient';
import { populateService } from '../../populate/basic';
import { ServiceResponse } from '../../../src/components/services/service.apicontract';

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
		expect((response.body.data[0] as ServiceResponse).name).toEqual(SERVICE_NAME);
		expect((response.body.data[0] as ServiceResponse).isSpAutoAssigned).toEqual(false);
	});
});
