import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { PgClient } from '../../utils/pgClient';
import { populateService } from '../../populate/basic';

describe('Tests endpoint and populate data', () => {
	const SERVICE_NAME = 'Service';
	const SERVICE_NAME_UPDATED = 'ServiceUpdated';
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

	it("should update first service's name", async () => {
		const service = await populateService({ nameService: SERVICE_NAME });

		const response2 = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME_UPDATED },
		});
		expect(response2.statusCode).toEqual(200);

		const response3 = await OrganisationAdminRequestEndpointSG.create({}).get('/services');
		expect(response3.statusCode).toEqual(200);
		expect(response3.body.data[0].name).toEqual(SERVICE_NAME_UPDATED);
	});

	it('Put service with labels', async () => {
		const service = await populateService({ nameService: SERVICE_NAME });
		const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME, labels: [{ label: 'name' }] },
		});
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.labels[0].label).toBe('name');
	});

	it('Put service with same labels (should fail)', async () => {
		const service = await populateService({ nameService: SERVICE_NAME });
		await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME, labels: [{ label: 'name' }] },
		});
		const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME, labels: [{ label: 'name' }] },
		});
		
		expect(response.statusCode).toEqual(400);
		expect(response.body.errorMessage).toStrictEqual('Service name is already present'); // Not sure about this
	});
});
