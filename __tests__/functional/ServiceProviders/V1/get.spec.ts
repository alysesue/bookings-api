import { OrganisationAdminRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { PgClient } from '../../../utils/pgClient';
import { postService } from '../../../populate/V1/services';
import { populateWeeklyTimesheet, postServiceProvider } from '../../../populate/V1/serviceProviders';

describe('Service providers functional tests - get', () => {
	const START_TIME_1 = '09:00';
	const END_TIME_1 = '10:00';
	const pgClient = new PgClient();
	let service;
	let serviceProvider;

	beforeAll(async (done) => {
		await pgClient.cleanAllTables();
		done();
	});

	afterAll(async (done) => {
		await pgClient.close();
		done();
	});

	beforeEach(async (done) => {
		service = await postService({ name: 'Service' });
		await postServiceProvider(service.id);
		serviceProvider = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).get(
			'/service-providers',
		);
		done();
	});

	afterEach(async (done) => {
		await pgClient.cleanAllTables();
		done();
	});

	it('should get service provider count', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).get(
			'/service-providers/count',
		);

		expect(response.statusCode).toEqual(200);
		expect(response.body.data).toEqual({ total: 1 });
	});

	it('should get available service providers', async () => {
		const serviceProviderId = serviceProvider.body.data[0].id;

		await populateWeeklyTimesheet({
			serviceProviderId,
			openTime: START_TIME_1,
			closeTime: END_TIME_1,
			scheduleSlot: 60,
		});
		const response = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).get(
			'/service-providers/available?from=2000-01-01&to=2040-02-01',
		);

		expect(response.statusCode).toEqual(200);
		expect(response.body.data.length).toEqual(1);
		expect(typeof response.body.data[0].id).toBe('number');
		expect(response.body.data[0].name).toEqual('sp');
		expect(response.body.data[0].email).toEqual('sp@govtech.com');
		expect(response.body.data[0].phone).toEqual('+6580000000');
	});

	it('should get specific service provider', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).get(
			`/service-providers/${serviceProvider.body.data[0].id}`,
		);

		expect(response.statusCode).toEqual(200);
		expect(typeof response.body.data.id).toBe('number');
		expect(response.body.data.name).toEqual('sp');
		expect(response.body.data.email).toEqual('sp@govtech.com');
		expect(response.body.data.phone).toEqual('+6580000000');
	});

	it('should get specific service provider schedule', async () => {
		const serviceProviderId = serviceProvider.body.data[0].id;
		await populateWeeklyTimesheet({
			serviceProviderId,
			openTime: START_TIME_1,
			closeTime: END_TIME_1,
			scheduleSlot: 60,
		});
		const response = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).get(
			`/service-providers/${serviceProviderId}/scheduleForm`,
		);

		expect(response.statusCode).toEqual(200);
		expect(response.body.data.weekdaySchedules.length).toEqual(7);
	});
});
