import { PgClient } from '../../../utils/pgClient';
import { populateUserServiceProvider, populateWeeklyTimesheet } from '../../../populate/basicV2';
import { AnonmymousEndpointSG } from '../../../utils/requestEndpointSG';
import { IdHasherForFunctional } from '../../../utils/idHashingUtil';

describe('Timeslot availability functional tests - get', () => {
	const pgClient = new PgClient();
	const idHasher = new IdHasherForFunctional();
	const NAME_SERVICE_1 = 'service1';
	const SERVICE_PROVIDER_NAME_1 = 'SP1';
	const START_TIME_1 = '09:00';
	const END_TIME_1 = '10:00';

	let result1;
	let serviceProvider1;
	let serviceId1;

	let unsignedServiceProviderId1: number;
	let unsignedServiceId1: number;

	afterAll(async (done) => {
		await pgClient.cleanAllTables();
		await pgClient.close();
		done();
	});

	beforeEach(async (done) => {
		await pgClient.cleanAllTables();

		result1 = await populateUserServiceProvider({
			nameService: NAME_SERVICE_1,
			serviceProviderName: SERVICE_PROVIDER_NAME_1,
			agencyUserId: 'A001',
		});
		serviceProvider1 = result1.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_1);

		serviceId1 = result1.services.find((item) => item.name === NAME_SERVICE_1).id;

		unsignedServiceId1 = await idHasher.convertHashToId(serviceId1);
		unsignedServiceProviderId1 = await idHasher.convertHashToId(serviceProvider1.id);

		await populateWeeklyTimesheet({
			serviceProviderId: unsignedServiceProviderId1,
			openTime: START_TIME_1,
			closeTime: END_TIME_1,
			scheduleSlot: 60,
		});

		done();
	});

	it('should retrieve service availability as anonymous (when service is configuration is set)', async () => {
		await pgClient.configureServiceAllowAnonymous({ serviceId: unsignedServiceId1 });

		const endpoint = await AnonmymousEndpointSG.create({ serviceId: serviceId1 });
		const response = await endpoint.get(
			'/timeslots/availability?startDate=2021-01-03T23:52:31.754Z&endDate=2021-01-31T15:59:59.999Z',
			{},
			'V2',
		);
		expect(response.statusCode).toBe(200);
	});

	it('should retrieve service provider availability as anonymous (when service is configuration is set)', async () => {
		await pgClient.configureServiceAllowAnonymous({ serviceId: unsignedServiceId1 });

		const endpoint = await AnonmymousEndpointSG.create({ serviceId: serviceId1 });
		const response = await endpoint.get(
			`/timeslots/availability?serviceProviderId=${serviceProvider1.id}&startDate=2021-01-03T23:52:31.754Z&endDate=2021-01-31T15:59:59.999Z`,
			{},
			'V2',
		);

		expect(response.statusCode).toBe(200);
	});
});
