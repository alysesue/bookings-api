import { PgClient } from '../../../utils/pgClient';
import { OrganisationAdminRequestEndpointSG } from '../../../utils/requestEndpointSG';

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

	it('Post service admin when array is empty', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/users/service-admins/upsert', {
			body: [],
		});
		expect(response.statusCode).toEqual(200);
	});

	it('Post upsert service admin', async () => {
		const body = [
			{
				name: 'name',
				email: 'email@email.com',

				agencyUserId: '2',
				uinfin: 'S5287560I',
				serviceNames: ['service1', 'service2'],
			},
		];
		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/users/service-admins/upsert', {
			body,
		});
		expect(response.statusCode).toEqual(200);
	});

	it('Post upsert service admin', async () => {
		const body = [
			{
				name: 'name',
				email: 'email@email.com',

				agencyUserId: '2',
				uinfin: 'S5287560I',
				serviceNames: ['service1', 'service2'],
			},
		];
		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/users/service-admins/upsert', {
			body,
		});
		expect(response.statusCode).toEqual(200);
		body[0].name = 'name2';
		const response2 = await OrganisationAdminRequestEndpointSG.create({}).post('/users/service-admins/upsert', {
			body,
		});
		expect(response2.statusCode).toEqual(200);
	});
});
