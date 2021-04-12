import { PgClient } from '../../utils/pgClient';
import { populateOneOffTimeslot, populateUserServiceProvider } from '../../populate/basic';
import { ServiceProviderResponseModel } from '../../../src/components/serviceProviders/serviceProviders.apicontract';

// tslint:disable-next-line: no-big-function
describe('Timeslots functional tests', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';
	const SERVICE_PROVIDER_NAME_1 = 'SP1';
	const START_TIME_1 = new Date('2021-03-05T01:00:00Z');
	const END_TIME_1 = new Date('2021-03-05T02:00:00Z');

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

		await populateOneOffTimeslot({
			serviceProviderId: serviceProvider1.id,
			startTime: START_TIME_1,
			endTime: END_TIME_1,
			capacity: 1,
			title: 'Title',
			description: 'Description',
		});

		done();
	});

	it('should add oneOffTimeslots', async () => {
		const service1TimeslotsResponse = await populateOneOffTimeslot({
			serviceProviderId: serviceProvider1.id,
			startTime: START_TIME_1,
			endTime: END_TIME_1,
			capacity: 1,
			title: 'Title',
			description: 'Description',
		});
		expect(service1TimeslotsResponse.title).toBeDefined();
		// ToDo: add expect for each one of the inputs, try to have all on the same test.
	});

	it('should return error when oneOffTimeslots incorrect', async () => {
		try {
			await populateOneOffTimeslot({
				serviceProviderId: serviceProvider1.id,
				startTime: END_TIME_1,
				endTime: START_TIME_1,
				capacity: 1,
				title:
					'iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii',
				description: 'Description',
			});
		} catch (e) {
			const res = [
				{ code: '10103', message: 'Start time must be less than end time.' },
				{
					code: '10101',
					message: 'Description should be max 4000 characters',
				},
			];
			expect(e.message).toStrictEqual(res);
		}
	});
});
