import { PgClient } from '../../utils/pgClient';

import { populateOneOffTimeslot, populateUserServiceProvider } from '../../populate/basic';
import { ServiceProviderResponseModel } from '../../../src/components/serviceProviders/serviceProviders.apicontract';
import { LabelRequestModel } from '../../../src/components/labels/label.apicontract';

describe('Timeslots functional tests', () => {
  const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';
	const SERVICE_PROVIDER_NAME_1 = 'SP1';
	const START_TIME_1 = new Date('2021-03-05T01:00:00Z');
	const END_TIME_1 = new Date('2021-03-05T02:00:00Z');

	const labels: LabelRequestModel[] = [];
	const label = new LabelRequestModel;
	label.label = 'Chinese';
	labels.push(label);

	let serviceProvider1: ServiceProviderResponseModel;


	afterAll(async (done) => {
		// await pgClient.cleanAllTables();
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

    console.log(result1);
    
		serviceProvider1 = result1.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_1);
    // serviceId1 = result1.services.find((item) => item.name === NAME_SERVICE_1).id.toString();

		done();
  });
  
  it('adding labels to populate one off timeslots', async () => {
    const response = await populateOneOffTimeslot({
			serviceProviderId: serviceProvider1.id,
			startTime: START_TIME_1,
			endTime: END_TIME_1,
			capacity: 1,
			labels: labels,
    });
    
    console.log(response.labels);
    expect(response.labels[0].label).toEqual(labels[0].label);
  });
});