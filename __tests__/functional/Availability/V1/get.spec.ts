import { PgClient } from '../../../utils/pgClient';
import { AnonmymousEndpointSG } from '../../../utils/requestEndpointSG';
import { populateUserServiceProvider } from '../../../populate/V1/users';
import { populateWeeklyTimesheet } from '../../../populate/V1/serviceProviders';

describe('Timeslot availability functional tests', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';
	const SERVICE_PROVIDER_NAME_1 = 'SP1';
	const START_TIME_1 = '09:00';
	const END_TIME_1 = '10:00';

	let result1;
	let serviceProvider1;
	let serviceId1;

	afterAll(async () => {
		await pgClient.cleanAllTables();
		await pgClient.close();
	});

	beforeEach(async () => {
		await pgClient.cleanAllTables();

		result1 = await populateUserServiceProvider({
			serviceNames: [NAME_SERVICE_1],
			name: SERVICE_PROVIDER_NAME_1,
			agencyUserId: 'A001',
		});
		serviceProvider1 = result1.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_1);

		serviceId1 = result1.services.find((item) => item.name === NAME_SERVICE_1).id;

		await populateWeeklyTimesheet({
			serviceProviderId: serviceProvider1.id,
			openTime: START_TIME_1,
			closeTime: END_TIME_1,
			scheduleSlot: 60,
		});
	});

	it('should retrieve service availability as anonymous (when service is configuration is set)', async () => {
		await pgClient.configureServiceAllowAnonymous({ serviceId: serviceId1 });

		const endpoint = await AnonmymousEndpointSG.create({ serviceId: serviceId1 });
		const response = await endpoint.get(
			'/timeslots/availability?startDate=2021-01-03T23:52:31.754Z&endDate=2021-01-31T15:59:59.999Z',
		);
		expect(response.statusCode).toBe(200);
	});

	it('should retrieve service provider availability as anonymous (when service is configuration is set)', async () => {
		await pgClient.configureServiceAllowAnonymous({ serviceId: serviceId1 });

		const endpoint = await AnonmymousEndpointSG.create({ serviceId: serviceId1 });
		const response = await endpoint.get(
			`/timeslots/availability?serviceProviderId=${serviceProvider1.id}&startDate=2021-01-03T23:52:31.754Z&endDate=2021-01-31T15:59:59.999Z`,
		);

		expect(response.statusCode).toBe(200);
	});
});
