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

	it('Post service with SP autoAssigned', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/services', {
			body: { name: SERVICE_NAME, isSpAutoAssigned: true },
		});
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.isSpAutoAssigned).toBe(true);
	});

	it('Post service with video conference default URL', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/services', {
			body: { name: SERVICE_NAME, videoConferenceUrl: 'http://www.zoom.us/1234567' },
		});
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.videoConferenceUrl).toBe('http://www.zoom.us/1234567');
	});

	it('Post service with invalid video conference default URL', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/services', {
			body: { name: SERVICE_NAME, videoConferenceUrl: 'www.zoom.us/1234567' },
		});

		expect(response.body.data[0].code).toBe('10301');
		expect(response.body.data[0].message).toBe('Invalid URL');
		expect(response.body.errorCode).toBe('SYS_INVALID_PARAM');
		expect(response.body.errorMessage).toBe('One or more business validations failed');
	});
});
