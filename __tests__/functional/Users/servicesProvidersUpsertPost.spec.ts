import { PgClient } from '../../utils/pgClient';
import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';

describe('Tests endpoint and populate data', () => {
	const pgClient = new PgClient();

	beforeAll(async () => {
		await pgClient.cleanAllTables();
	});

	afterAll(async () => {
		await pgClient.close();
	});

	afterEach(async () => {
		await pgClient.cleanAllTables();
	});

	it('Post service', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/users/service-providers/upsert', {
			body: [
				{
					name: 'name',
					email: 'email@email.com',
					phoneNumber: '+33 3333 3333',
					agencyUserId: '2',
					uinfin: '1221jskfl 1233',
					serviceName: 'service',
				},
			],
		});
		expect(response.statusCode).toEqual(204);
		const responseServiceProvider = await OrganisationAdminRequestEndpointSG.create({}).get('/service-providers');
		const responseService = await OrganisationAdminRequestEndpointSG.create({}).get('/services');
		expect(responseServiceProvider.body.data[0].name).toEqual('name');
		expect(responseService.body.data[0].name).toEqual('service');
	});
});
