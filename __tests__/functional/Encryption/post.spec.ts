import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { PgClient } from '../../utils/pgClient';

describe('Tests endpoint encrypt', () => {
	const SERVICE_NAME = 'Service';
	const pgClient = new PgClient();

	afterAll(async () => {
		await pgClient.close();
	});

	it('Post encrypt', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/encryption/encrypt', {
			body: { name: SERVICE_NAME },
		});
		expect(response.statusCode).toEqual(200);
	});

	it('Post decrypt', async () => {
		const body = { name: SERVICE_NAME };
		const encryptRes = await OrganisationAdminRequestEndpointSG.create({}).post('/encryption/encrypt', {
			body: { name: SERVICE_NAME },
		});
		const decrpytRes = await OrganisationAdminRequestEndpointSG.create({}).post('/encryption/decrypt', {
			body: encryptRes.body,
		});
		expect(encryptRes.statusCode).toEqual(200);
		expect(decrpytRes.body.data).toEqual(body);
	});
});
