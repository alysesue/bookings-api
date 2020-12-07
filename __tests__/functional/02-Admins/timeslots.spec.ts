import { PgClient } from '../../utils/pgClient';
import {
	OrganisationAdminRequestEndpointSG,
} from '../../utils/requestEndpointSG';
import {
	populateServiceAndServiceProvider,
} from '../../Populate/basic';

describe('Timeslots functional tests', () => {
	const pgClient = new PgClient();
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
		            weekDay: 0,
		            startTime: '10:00',
		            endTime: '11:00',
		            capacity: 2,
		        },
		    },
		);
		expect(response.statusCode).toEqual(201);
	});
});
