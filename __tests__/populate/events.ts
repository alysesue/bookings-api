import { OrganisationAdminRequestEndpointSG } from '../utils/requestEndpointSG';
import { EventRequest, EventResponse, EventTimeslotRequest } from '../../src/components/events/events.apicontract';

export const getOneOffTimeslotRequest = ({
	serviceProviderId,
	startDateTime,
	endDateTime,
	idSigned,
}: {
	serviceProviderId: number;
	startDateTime?: Date;
	endDateTime?: Date;
	idSigned?: string;
}): EventTimeslotRequest =>
	({
		startDateTime: startDateTime || new Date(Date.now() + 24 * 60 * 60 * 1000),
		endDateTime: endDateTime || new Date(Date.now() + 25 * 60 * 60 * 1000),
		idSigned,
		serviceProviderId,
	} as EventTimeslotRequest);

export const getEventRequest = (eventRequest: Partial<EventRequest>, oneOffTimeslotRequest: EventTimeslotRequest[]) =>
	({
		serviceId: eventRequest.serviceId || 1,
		title: eventRequest.title || 'title',
		description: eventRequest.description || 'description',
		capacity: eventRequest.capacity || 1,
		labelIds: eventRequest.labelIds || [],
		timeslots: oneOffTimeslotRequest,
	} as EventRequest);

export const populateEvent = async (eventRequest: Partial<EventRequest>): Promise<EventResponse> => {
	const oneOffTimeslotRequests = eventRequest.timeslots.map(
		({ serviceProviderId, startDateTime, endDateTime, idSigned }) =>
			getOneOffTimeslotRequest({ serviceProviderId, startDateTime, endDateTime, idSigned }),
	);

	const event = getEventRequest(eventRequest, oneOffTimeslotRequests);
	const response = await OrganisationAdminRequestEndpointSG.create({}).post(`/events/`, {
		body: { ...event },
	});
	expect(response.statusCode).toEqual(201);

	return response.body.data as EventResponse;
};
