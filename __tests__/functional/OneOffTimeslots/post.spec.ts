import { PgClient } from '../../utils/pgClient';

import { populateOneOffTimeslot, populateServiceLabel, populateUserServiceProvider } from '../../populate/basic';
import { ServiceProviderResponseModel } from '../../../src/components/serviceProviders/serviceProviders.apicontract';
import { LabelRequestModel } from '../../../src/components/labels/label.apicontract';

describe('Timeslots functional tests', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';
	const SERVICE_PROVIDER_NAME_1 = 'SP1';
	const START_TIME_1 = new Date('2021-03-05T01:00:00Z');
	const END_TIME_1 = new Date('2021-03-05T02:00:00Z');

	const labels: LabelRequestModel[] = [];
	const label = new LabelRequestModel();
	label.label = 'Chinese';
	labels.push(label);

	let serviceProvider1: ServiceProviderResponseModel;

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

		await populateServiceLabel({
			serviceId: serviceProvider1.serviceId,
			serviceName: NAME_SERVICE_1,
			labels: ['Chinese'],
		});

		done();
	});

	it('adding labels to populate one off timeslots', async () => {
		const response = await populateOneOffTimeslot({
			serviceProviderId: serviceProvider1.id,
			startTime: START_TIME_1,
			endTime: END_TIME_1,
			capacity: 1,
			labels,
		});

		expect(response.labels[0].label).toEqual(labels[0].label);
	});
});
