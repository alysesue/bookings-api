// tslint:disable-next-line: no-big-function
import { PgClient } from '../../utils/pgClient';
import {createEventRequest, createOneOffTimeslotRequest, postEvent, putEvent} from '../../populate/V2/events';
import { populateServiceAndServiceProvider } from '../../populate/V2/servieProviders';
import {EventResponse} from "../../../src/components/events/events.apicontract";

describe('Event update functional tests', () => {
	const pgClient = new PgClient();
	let service;
	let serviceProvider;
	let eventRequest;
	let oneOffTimeslotRequest1;
	let oneOffTimeslotRequest2;
	const endTime = new Date(Date.now() + 25 * 60 * 60 * 1000);

	beforeEach(async () => {
		await pgClient.cleanAllTables();
		const { service: srv, serviceProvider: sp } = await populateServiceAndServiceProvider({
			categories: [
				{ categoryName: 'Location', labels: [{ label: 'Toa Payoh' }, { label: 'Sydney' }] },
				{ categoryName: 'Language', labels: [{ label: 'Chinese' }, { label: 'English' }, { label: 'Malay' }] },
				{ categoryName: 'Program Type', labels: [{ label: 'Virtual' }, { label: 'On-site' }] },
			],
			labels: [{ label: 'Marriage' }, { label: 'Singapore' }],
		});
		service = srv;
		serviceProvider = sp[0];		service = srv;
		serviceProvider = sp[0];
		oneOffTimeslotRequest1 = createOneOffTimeslotRequest({
			endDateTime: endTime,
			serviceProviderId: serviceProvider.id,
		});
		oneOffTimeslotRequest2 = createOneOffTimeslotRequest({ serviceProviderId: serviceProvider.id });
		eventRequest = createEventRequest({ serviceId: service.id }, [oneOffTimeslotRequest1, oneOffTimeslotRequest2]);
		await postEvent(eventRequest);
	});

	afterAll(async () => {
		await pgClient.cleanAllTables();
		await pgClient.close();
	});

	it('Should update title of a simple event', async () => {
		const oneOffTimeslotRequest = createOneOffTimeslotRequest({ serviceProviderId: serviceProvider.id });
		const event = createEventRequest(
			{ serviceId: service.id, labelIds: [service.labels[0].id, service.categories[0].labels[1].id] },
			[oneOffTimeslotRequest],
		);
		const postEventResponse = await postEvent(event);

		event.title = 'newTitle';

		const eventResponse = await putEvent(postEventResponse.id, event)

		expect(eventResponse.title).toEqual('newTitle');
		expect(eventResponse.description).toEqual('description');
		expect(eventResponse.service.id).toEqual(service.id);
		expect(eventResponse.service.name).toEqual(service.name);
		expect(eventResponse.firstStartDateTime).toEqual(eventResponse.timeslots[0].startDateTime);
		expect(eventResponse.lastEndDateTime).toEqual(eventResponse.timeslots[0].endDateTime);
		expect(eventResponse.labels[0].id).toEqual(service.labels[0].id);
		expect(eventResponse.labels[1].id).toEqual(service.categories[0].labels[1].id);

		expect(new Date(eventResponse.timeslots[0].startDateTime)).toEqual(oneOffTimeslotRequest.startDateTime);
		expect(new Date(eventResponse.timeslots[0].endDateTime)).toEqual(oneOffTimeslotRequest.endDateTime);
		expect(eventResponse.timeslots[0].serviceProvider.name).toEqual(serviceProvider.name);
	});

	it('Should update slot of a simple event', async () => {
		const oneOffTimeslotRequest = createOneOffTimeslotRequest({ serviceProviderId: serviceProvider.id });
		const event = createEventRequest(
			{ serviceId: service.id, labelIds: [service.labels[0].id, service.categories[0].labels[1].id] },
			[oneOffTimeslotRequest],
		);
		const postEventResponse = await postEvent(event);

		const newOneOffTimeslotRequest = createOneOffTimeslotRequest({ serviceProviderId: serviceProvider.id });
		const newEvent = createEventRequest(
			{ serviceId: service.id, labelIds: [service.labels[0].id, service.categories[0].labels[1].id] },
			[newOneOffTimeslotRequest],
		);
		newEvent.id = event.id;
		newEvent.title = 'newTitle';

		const eventResponse = await putEvent(postEventResponse.id, newEvent);
		const resStartDateTime = new Date(eventResponse.timeslots[0].startDateTime).toDateString();
		const resEndDateTime = new Date(eventResponse.timeslots[0].endDateTime).toDateString();

		expect(eventResponse.title).toEqual('newTitle');
		expect(eventResponse.description).toEqual('description');
		expect(eventResponse.service.id).toEqual(service.id);
		expect(eventResponse.service.name).toEqual(service.name);
		expect(resStartDateTime).toEqual((newOneOffTimeslotRequest.startDateTime.toDateString()));
		expect(resEndDateTime).toEqual((newOneOffTimeslotRequest.endDateTime.toDateString()));
		expect(eventResponse.labels[0].id).toEqual(service.labels[0].id);
		expect(eventResponse.labels[1].id).toEqual(service.categories[0].labels[1].id);

		expect(new Date(eventResponse.timeslots[0].startDateTime)).toEqual(newOneOffTimeslotRequest.startDateTime);
		expect(new Date(eventResponse.timeslots[0].endDateTime)).toEqual(newOneOffTimeslotRequest.endDateTime);
		expect(eventResponse.timeslots[0].serviceProvider.name).toEqual(serviceProvider.name);
	});
});
