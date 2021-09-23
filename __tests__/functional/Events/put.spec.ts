// tslint:disable-next-line: no-big-function
import { PgClient } from '../../utils/pgClient';
import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { EventResponse } from '../../../src/components/events/events.apicontract';
import { getEventRequest, getOneOffTimeslotRequest, populateEvent } from '../../populate/events';
import { populateServiceAndServiceProvider } from '../../populate/serviceProvider';
import { API_VERSION } from '../../../src/config/api-version';

describe('Event update functional tests', () => {
	const pgClient = new PgClient();
	let service;
	let serviceProvider;
	let event;
	let eventRequest;
	let oneOffTimeslotRequest1;
	let oneOffTimeslotRequest2;
	const endTime = new Date(Date.now() + 25 * 60 * 60 * 1000);

	beforeEach(async (done) => {
		await pgClient.cleanAllTables();
		const { service: srv, serviceProvider: sp } = await populateServiceAndServiceProvider({
			requestOptions: { version: API_VERSION.V2 },
		});
		service = srv;
		serviceProvider = sp;
		oneOffTimeslotRequest1 = getOneOffTimeslotRequest({
			endDateTime: endTime,
			serviceProviderId: serviceProvider.id,
		});
		oneOffTimeslotRequest2 = getOneOffTimeslotRequest({ serviceProviderId: serviceProvider.id });
		eventRequest = getEventRequest({ serviceId: service.id }, [oneOffTimeslotRequest1, oneOffTimeslotRequest2]);
		event = await populateEvent(eventRequest);

		done();
	});

	afterAll(async (done) => {
		await pgClient.cleanAllTables();
		await pgClient.close();
		done();
	});

	it('Should update a simple event', async () => {
		eventRequest.id = event.id;
		eventRequest.title = 'newTitle';

		const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/events/${event.id}`, {
			body: { ...eventRequest },
		});
		const eventResponse = response.body.data as EventResponse;

		expect(eventResponse.id).toEqual(eventRequest.id);
		expect(eventResponse.title).toEqual('newTitle');
		expect(eventResponse.description).toEqual('description');
		expect(eventResponse.service.id).toEqual(service.id);
		expect(response.statusCode).toEqual(201);

		expect(eventResponse.timeslots.length).toBe(2);
		expect(new Date(eventResponse.timeslots[0].startDateTime)).toEqual(oneOffTimeslotRequest1.startDateTime);
		expect(new Date(eventResponse.timeslots[0].endDateTime)).toEqual(endTime);
	});

	it('Should be able to update and delete one timeslot', async () => {
		eventRequest.id = event.id;

		oneOffTimeslotRequest1.id = event.timeslots[0].id;
		const newEndDate = new Date(Date.now() + 27 * 60 * 60 * 1000);
		oneOffTimeslotRequest1.endDateTime = newEndDate;
		eventRequest.timeslots = [oneOffTimeslotRequest1];

		const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/events/${event.id}`, {
			body: { ...eventRequest },
		});
		expect(response.statusCode).toEqual(201);
		const eventResponse = response.body.data as EventResponse;

		expect(eventResponse.id).toEqual(eventRequest.id);
		expect(eventResponse.timeslots.length).toBe(1);
		expect(new Date(eventResponse.timeslots[0].startDateTime)).toEqual(oneOffTimeslotRequest1.startDateTime);
		expect(new Date(eventResponse.timeslots[0].endDateTime)).toEqual(newEndDate);
	});

	it('Should be able to add one timeslot', async () => {
		eventRequest.id = event.id;
		const timelost3 = (oneOffTimeslotRequest2 = getOneOffTimeslotRequest({
			serviceProviderId: serviceProvider.id,
		}));
		event.timeslots.map((event) => {
			event.serviceProviderId = serviceProvider.id;
			return event;
		});
		eventRequest.timeslots = [...event.timeslots, timelost3];

		const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/events/${event.id}`, {
			body: { ...eventRequest },
		});
		expect(response.statusCode).toEqual(201);
		const eventResponse = response.body.data as EventResponse;

		expect(eventResponse.id).toEqual(eventRequest.id);
		expect(eventResponse.timeslots.length).toBe(3);
	});
});
