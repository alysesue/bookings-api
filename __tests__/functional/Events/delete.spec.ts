import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { populateServiceAndServiceProvider } from '../../populate/serviceProvider';
import { getEventRequest, getOneOffTimeslotRequest } from '../../populate/events';
import { PgClient } from '../../utils/pgClient';

describe('Event post functional tests', () => {
	const pgClient = new PgClient();
	let service;
	let serviceProvider;
	let event;
	let eventRequest;

	beforeEach(async (done) => {
		await pgClient.cleanAllTables();
		const { service: srv, serviceProvider: sp } = await populateServiceAndServiceProvider({});
		service = srv;
		serviceProvider = sp;
		const oneOffTimeslotRequest = getOneOffTimeslotRequest({ serviceProviderId: serviceProvider.id });
		eventRequest = getEventRequest({ serviceId: service.id }, [oneOffTimeslotRequest]);
		// event = await populateEvent(eventRequest);
		done();
	});

	afterAll(async (done) => {
		await pgClient.cleanAllTables();
		await pgClient.close();
		done();
	});

	it('should test', function () {

	});

	// it('Should delete an event', async () => {
	// 	const response2 = await OrganisationAdminRequestEndpointSG.create({}).delete(`/events/${event.id}`);
	// 	expect(response2.statusCode).toEqual(204);
	// });
});
