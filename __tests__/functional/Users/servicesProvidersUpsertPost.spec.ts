import { PgClient } from '../../utils/pgClient';
import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';

describe('Tests endpoint and populate data', () => {
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

	it('Post service provider', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/users/service-providers/upsert', {
			body: [
				{
					name: 'name',
					email: 'email@email.com',
					phoneNumber: '800 120 7163',
					agencyUserId: '2',
					uinfin: 'S8647188D',
					serviceName: 'service',
				},
			],
		});
		expect(response.statusCode).toEqual(200);
		const responseServiceProvider = await OrganisationAdminRequestEndpointSG.create({}).get('/service-providers');
		const responseService = await OrganisationAdminRequestEndpointSG.create({}).get('/services');
		expect(responseServiceProvider.body.data[0].name).toEqual('name');
		expect(responseService.body.data[0].name).toEqual('service');
	});

	it('Post upsert service providers', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/users/service-providers/upsert', {
			body: [
				{
					name: 'name',
					email: 'email@email.com',
					phoneNumber: '800 120 7163',
					agencyUserId: '1',
					uinfin: 'S8647188D',
					serviceName: 'service',
				},
			],
		});
		expect(response.statusCode).toEqual(200);
		const response2 = await OrganisationAdminRequestEndpointSG.create({}).post('/users/service-providers/upsert', {
			body: [
				{
					name: 'name2',
					email: 'email@email.com',
					phoneNumber: '800 120 7163',
					agencyUserId: '1',
					uinfin: 'S8647188D',
					serviceName: 'service',
				},
			],
		});
		expect(response2.statusCode).toEqual(200);
		const responseServiceProvider = await OrganisationAdminRequestEndpointSG.create({}).get('/service-providers');
		expect(responseServiceProvider.body.data[0].name).toEqual('name2');
	});
});
