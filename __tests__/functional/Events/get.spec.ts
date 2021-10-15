import { PgClient } from '../../utils/pgClient';
import { populateServiceAndServiceProvider } from '../../populate/V2/servieProviders';
import { createEventRequest, createOneOffTimeslotRequest, getEvents, postEvent } from '../../populate/V1/events';
import { populateOneOffTimeslot } from '../../populate/V2/oneOffTimeslots';
import { EventResponse } from '../../../src/components/events/events.apicontract';
import { ServiceResponseV2 } from '../../../src/components/services/service.apicontract';

describe('Get events functional tests', () => {
	const pgClient = new PgClient();
	let service: ServiceResponseV2;
	let serviceProvider;

	beforeEach(async (done) => {
		await pgClient.cleanAllTables();
		const { service: srv, serviceProvider: sp } = await populateServiceAndServiceProvider({});
		service = srv;
		serviceProvider = sp[0];

		const oneOffTimeslotRequest = createOneOffTimeslotRequest({ serviceProviderId: serviceProvider.id });
		const event = createEventRequest({ serviceId: service.id }, [oneOffTimeslotRequest]);
		await postEvent(event);
		done();
	});

	afterAll(async (done) => {
		// await pgClient.cleanAllTables();
		await pgClient.close();
		done();
	});

	it('Should get all events but not oneOffTimeslot', async () => {
		await populateOneOffTimeslot({
			serviceProviderId: serviceProvider.id,
			startTime: new Date('2021-03-05T05:00:00Z'),
			endTime: new Date('2021-03-05T06:00:00Z'),
		});
		const response = await getEvents(service.id, {});

		expect(response.length).toBe(1);
		const eventRes = response[0] as EventResponse;

		expect(eventRes.title).toEqual('title');
		expect(eventRes.description).toEqual('description');
	});

	it('Should get only one event if limit = 1', async () => {
		const oneOffTimeslotRequest = createOneOffTimeslotRequest({ serviceProviderId: serviceProvider.id });
		await postEvent({ serviceId: service.id, timeslots: [oneOffTimeslotRequest] });
		let response = await getEvents(service.id, { limit: 2 });
		expect(response.length).toBe(2);
		response = await getEvents(service.id, { limit: 1 });
		expect(response.length).toBe(1);
	});

	it('Should filter by date', async () => {
		const startDateTime = new Date(Date.UTC(2021, 11, 10, 0, 0));
		const endDateTime = new Date(Date.UTC(2021, 11, 10, 1, 0));
		const timeslotOutDateRange = createOneOffTimeslotRequest({ serviceProviderId: serviceProvider.id });
		const timeslotInDateRange = createOneOffTimeslotRequest({
			startDateTime,
			endDateTime,
			serviceProviderId: serviceProvider.id,
		});
		let response = await getEvents(service.id, { startDateTime, endDateTime });
		expect(response.length).toBe(0);
		await postEvent({ serviceId: service.id, timeslots: [timeslotInDateRange] });
		response = await getEvents(service.id, { startDateTime, endDateTime });
		expect(response.length).toBe(1);
		await postEvent({ serviceId: service.id, timeslots: [timeslotOutDateRange, timeslotInDateRange] });
		response = await getEvents(service.id, { startDateTime, endDateTime });
		expect(response.length).toBe(1);
	});

	it('Should filter by title and order them', async () => {
		const oneOffTimeslotRequest = createOneOffTimeslotRequest({ serviceProviderId: serviceProvider.id });
		await postEvent({ serviceId: service.id, timeslots: [oneOffTimeslotRequest],title: 'lastNumero'});
		await postEvent({ serviceId: service.id, timeslots: [oneOffTimeslotRequest],title: 'Numero2'});
		await postEvent({ serviceId: service.id, timeslots: [oneOffTimeslotRequest],title: 'Numero1'});
		const response = await getEvents(service.id, {title: 'nu'});
		expect(response.length).toBe(2);
		expect(response[0].title).toBe('Numero1');
		expect(response[1].title).toBe('Numero2');
	});
});
