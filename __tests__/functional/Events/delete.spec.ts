import { PgClient } from '../../utils/pgClient';
import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { populateServiceAndServiceProvider } from '../../populate/V2/servieProviders';
import { createEventRequest, createOneOffTimeslotRequest, postEvent } from '../../populate/V1/events';

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
		serviceProvider = sp[0];
		const oneOffTimeslotRequest = createOneOffTimeslotRequest({ serviceProviderId: serviceProvider.id });
		eventRequest = createEventRequest({ serviceId: service.id }, [oneOffTimeslotRequest]);
		event = await postEvent(eventRequest);
		done();
	});

	afterAll(async (done) => {
		await pgClient.cleanAllTables();
		await pgClient.close();
		done();
	});

	it('Should delete an event', async () => {
		const response2 = await OrganisationAdminRequestEndpointSG.create({}).delete(`/events/${event.id}`);
		expect(response2.statusCode).toEqual(204);
	});
});
