import { PgClient } from '../../utils/pgClient';
import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { populateUserServiceProvider } from '../../populate/basic';

describe('Timeslots functional tests', () => {
	const pgClient = new PgClient();
	const WEEKDAY = 0;
	const START_TIME = '10:00';
	const END_TIME = '11:00';
	const CAPACITY = 2;
	let result;

	beforeAll(async (done) => {
		await pgClient.cleanAllTables();
		done();
	});
	afterAll(async (done) => {
		await pgClient.close();
		done();
	});

	beforeEach(async (done) => {
		result = await populateUserServiceProvider({ nameService: 'Service1', agencyUserId: 'A001' });
		done();
	});

	afterEach(async (done) => {
		await pgClient.cleanAllTables();
		done();
	});

	it('should create individual timeslot with capacity', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post(
			`/service-providers/${result.serviceProviders[0].id}/timeslotSchedule/timeslots`,
			{
				body: {
					weekDay: WEEKDAY,
					startTime: START_TIME,
					endTime: END_TIME,
					capacity: CAPACITY,
				},
			},
		);
		expect(response.statusCode).toEqual(201);
		expect(response.body.data.weekDay).toEqual(WEEKDAY);
		expect(response.body.data.startTime).toEqual(START_TIME);
		expect(response.body.data.endTime).toEqual(END_TIME);
		expect(response.body.data.capacity).toEqual(CAPACITY);
	});
});
