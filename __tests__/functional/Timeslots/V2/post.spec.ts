import { PgClient } from '../../../utils/pgClient';
import { OrganisationAdminRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { populateUserServiceProvider } from '../../../populate/V2/users';

describe('Timeslots functional tests', () => {
	const pgClient = new PgClient();
	const WEEKDAY = 0;
	const START_TIME = '10:00';
	const END_TIME = '11:00';
	const CAPACITY = 2;
	let result;

	beforeAll(async () => {
		await pgClient.cleanAllTables();
	});
	afterAll(async () => {
		await pgClient.close();
	});

	beforeEach(async () => {
		result = await populateUserServiceProvider({ serviceNames: ['Service'], name: 'Sp1', agencyUserId: 'A001' });
	});

	afterEach(async () => {
		await pgClient.cleanAllTables();
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
			'V2',
		);
		expect(response.statusCode).toEqual(201);
		expect(response.body.data.weekDay).toEqual(WEEKDAY);
		expect(response.body.data.startTime).toEqual(START_TIME);
		expect(response.body.data.endTime).toEqual(END_TIME);
		expect(response.body.data.capacity).toEqual(CAPACITY);
	});
});
