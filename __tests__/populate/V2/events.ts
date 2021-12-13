import {
	EventFilter,
	EventRequest,
	EventResponse,
	EventTimeslotRequest,
} from '../../../src/components/events/events.apicontract';
import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';

export const createOneOffTimeslotRequest = ({
	serviceProviderId,
	startDateTime,
	endDateTime,
	id,
}: {
	serviceProviderId: string;
	startDateTime?: Date;
	endDateTime?: Date;
	id?: string;
}): EventTimeslotRequest =>
	({
		startDateTime: startDateTime || new Date(Date.now() + 24 * 60 * 60 * 1000),
		endDateTime: endDateTime || new Date(Date.now() + 25 * 60 * 60 * 1000),
		id,
		serviceProviderId,
	} as EventTimeslotRequest);

export const createEventRequest = (
	eventRequest: Partial<EventRequest>,
	oneOffTimeslotRequest: EventTimeslotRequest[],
) =>
	({
		serviceId: eventRequest.serviceId || '1',
		title: eventRequest.title || 'title',
		description: eventRequest.description || 'description',
		capacity: eventRequest.capacity || 1,
		labelIds: eventRequest.labelIds || [],
		timeslots: oneOffTimeslotRequest,
	} as EventRequest);

export const postEvent = async (eventRequest: Partial<EventRequest>): Promise<EventResponse> => {
	const oneOffTimeslotRequests = eventRequest.timeslots.map(({ serviceProviderId, startDateTime, endDateTime, id }) =>
		createOneOffTimeslotRequest({ serviceProviderId, startDateTime, endDateTime, id }),
	);
	const event = createEventRequest(eventRequest, oneOffTimeslotRequests);
	const response = await OrganisationAdminRequestEndpointSG.create({}).post(
		`/events/`,
		{
			body: { ...event },
		},
		'V2',
	);

	expect(response.statusCode).toEqual(201);

	return response.body.data as EventResponse;
};

export const putEvent = async (id: string, eventRequest: Partial<EventRequest>): Promise<EventResponse> => {
	const response = await OrganisationAdminRequestEndpointSG.create({}).put(
		`/events/${id}`,
		{
			body: { ...eventRequest },
		},
		'V2',
	);

	expect(response.statusCode).toEqual(201);

	return response.body.data as EventResponse;
};

export const getEvents = async (serviceId: string, eventFilter: Partial<EventFilter>): Promise<EventResponse[]> => {
	const response = await OrganisationAdminRequestEndpointSG.create({ serviceId }).get(
		`/events`,
		{
			params: {
				...eventFilter,
			},
		},
		'V2',
	);
	expect(response.statusCode).toEqual(200);
	return response.body.data as EventResponse[];
};
