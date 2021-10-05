import { PgClient } from '../../utils/pgClient';
import { populateServiceAndServiceProvider } from '../../populate/V2/servieProviders';
import { getOneOffTimeslotRequest, populateEvent, getEventRequest } from '../../populate/V1/events';
import { populateOneOffTimeslot } from '../../populate/V2/oneOffTimeslots';
import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { EventResponse } from '../../../src/components/events/events.apicontract';

describe('Get events functional tests', () => {
	const pgClient = new PgClient();
	let service;
	let serviceProvider;

	beforeEach(async (done) => {
		await pgClient.cleanAllTables();
		const { service: srv, serviceProvider: sp } = await populateServiceAndServiceProvider({});
		service = srv;
		serviceProvider = sp[0];
		const oneOffTimeslotRequest = getOneOffTimeslotRequest({ serviceProviderId: serviceProvider.id });
		const event = getEventRequest({ serviceId: service.id }, [oneOffTimeslotRequest]);
		await populateEvent(event);
		done();
	});

	afterAll(async (done) => {
		await pgClient.cleanAllTables();
		await pgClient.close();
		done();
	});

	it('should test', function () {});

	it('Should get all events but not oneOffTimeslot', async () => {
		await populateOneOffTimeslot({
			serviceProviderId: serviceProvider.id,
			startTime: new Date('2021-03-05T05:00:00Z'),
			endTime: new Date('2021-03-05T06:00:00Z'),
		});
		const response = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).get(`/events`, {});
		expect(response.statusCode).toEqual(200);
		const eventsRes = response.body.data as EventResponse[];
		expect(eventsRes.length).toBe(1);
		const eventRes = response.body.data[0] as EventResponse;

		expect(eventRes.title).toEqual('title');
		expect(eventRes.description).toEqual('description');
	});

	it('Should get only one event if limit = 1', async () => {
		const oneOffTimeslotRequest = getOneOffTimeslotRequest({ serviceProviderId: serviceProvider.id });
		await populateEvent({ serviceId: service.id, timeslots: [oneOffTimeslotRequest] });
		let response = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).get(`/events`, {
			params: {
				limit: 2,
			},
		});
		expect(response.statusCode).toEqual(200);
		let eventsRes = response.body.data as EventResponse[];
		expect(eventsRes.length).toBe(2);

		response = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).get(`/events`, {
			params: {
				limit: 1,
			},
		});
		expect(response.statusCode).toEqual(200);
		eventsRes = response.body.data as EventResponse[];
		expect(eventsRes.length).toBe(1);
	});
});
