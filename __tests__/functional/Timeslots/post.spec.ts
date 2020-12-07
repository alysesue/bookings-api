import { PgClient } from '../../utils/pgClient';
import {
	OrganisationAdminRequestEndpointSG,
} from '../../utils/requestEndpointSG';
import {
	populateServiceAndServiceProvider,
} from '../../Populate/basic';

describe('Timeslots functional tests', () => {
	const pgClient = new PgClient();
	const WEEKDAY = 0;
	const START_TIME = '10:00';
	const END_TIME = '11:00';
	const CAPACITY = 2;
	let result1;

	beforeAll(async () => {
		await pgClient.cleanAllTables();
	});
	afterAll(async () => {
		await pgClient.close();
	});

	beforeEach(async () => {
		result1 = await populateServiceAndServiceProvider({nameService: 'Service1'});
	});

	afterEach(async () => {
		await pgClient.cleanAllTables();
	});

	it('should create individual timeslot with capacity', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post(
		    `/service-providers/${result1.serviceProviderId}/timeslotSchedule/timeslots`,
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
		expect(JSON.parse(response.body).data.weekDay).toEqual(WEEKDAY);
		expect(JSON.parse(response.body).data.startTime).toEqual(START_TIME);
		expect(JSON.parse(response.body).data.endTime).toEqual(END_TIME);
		expect(JSON.parse(response.body).data.capacity).toEqual(CAPACITY);
	});
});
