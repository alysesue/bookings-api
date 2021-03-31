import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { PgClient } from '../../utils/pgClient';

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

	it('Post service', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/services', {
			body: { name: SERVICE_NAME },
		});
		expect(response.statusCode).toEqual(200);
	});

	it('Post service with labels', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/services', {
			body: { name: SERVICE_NAME, labels: [{ label: 'name' }] },
		});
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.labels[0].label).toBe('name');
	});
});
