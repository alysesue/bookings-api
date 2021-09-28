import { populateOneOffTimeslot, updateOneOffTimeslot, populateUserServiceProvider } from '../../../populate/basicV2';
import { PgClient } from '../../../utils/pgClient';
import {
	ServiceProviderResponseModelV2
} from '../../../../src/components/serviceProviders/serviceProviders.apicontract';

describe('One-off timeslots functional tests - put', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';
	const SERVICE_PROVIDER_NAME_1 = 'SP1';
	const START_TIME_1 = new Date('2021-03-05T01:00:00Z');
	const END_TIME_1 = new Date('2021-03-05T02:00:00Z');

	let serviceProvider1: ServiceProviderResponseModelV2;

	afterAll(async (done) => {
		await pgClient.cleanAllTables();
		await pgClient.close();
		done();
	});

	beforeEach(async (done) => {
		await pgClient.cleanAllTables();

		const result1 = await populateUserServiceProvider({
			nameService: NAME_SERVICE_1,
			serviceProviderName: SERVICE_PROVIDER_NAME_1,
			agencyUserId: 'A001',
		});

		serviceProvider1 = result1.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_1);

		done();
	});

	it('should update oneOffTimeslots', async () => {
		const [, service1TimeslotsResponse] = await populateOneOffTimeslot({
			serviceProviderId: serviceProvider1.id,
			startTime: START_TIME_1,
			endTime: END_TIME_1,
			capacity: 1,
			title: 'Title',
			description: 'Description',
		});

		const { idSigned } = service1TimeslotsResponse;
		const [, updatedData] = await updateOneOffTimeslot({
			serviceProviderId: serviceProvider1.id,
			startTime: START_TIME_1,
			endTime: END_TIME_1,
			capacity: 5,
			title: 'Title Changed',
			description: 'Description Changed',
			idSigned,
		});

		expect(updatedData).toEqual({
			capacity: 5,
			startDateTime: '2021-03-05T01:00:00.000Z',
			endDateTime: '2021-03-05T02:00:00.000Z',
			labels: [],
			title: 'Title Changed',
			description: 'Description Changed',
			idSigned,
		});
	});
});
