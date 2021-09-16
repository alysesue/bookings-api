import { Inject, InRequestScope } from 'typescript-ioc';
import { IdHasher } from '../../infrastructure/idHasher';
import {
	EventOneOffTimeslotRequest,
	EventRequest,
	EventResponse,
	EventTimeslotRequest,
	EventTimeslotResponse,
	IEventRequest,
} from './events.apicontract';
import { Event } from '../../models/entities/event';
import { Label, OneOffTimeslot, Service } from '../../models';
import { OneOffTimeslotRequestV1 } from '../oneOffTimeslots/oneOffTimeslots.apicontract';
import { LabelsMapper } from '../labels/labels.mapper';
import { ServicesMapper } from '../services/services.mapper';
import { sortDate } from '../../tools/date';

@InRequestScope
export class EventsMapper {
	@Inject
	private idHasher: IdHasher;
	@Inject
	private labelsMapper: LabelsMapper;

	public mapToModel(request: IEventRequest): Event {
		const { serviceId, title, description, capacity } = request;
		const event = new Event();
		event.serviceId = serviceId;
		event.title = title;
		event.capacity = capacity;
		event.description = description;

		return event;
	}

	public mapUpdateModel(previous: Event, request: EventRequest): Event {
		const { title, description, capacity } = request;
		previous.title = title;
		previous.capacity = capacity;
		previous.description = description;
		return previous;
	}

	public mapOneOffTimeslotsRequestToEventOneOffTimeslotRequest(
		request: OneOffTimeslotRequestV1,
		oneOffTimeslot: OneOffTimeslot,
		previousState = new Event(),
	): EventOneOffTimeslotRequest {
		const { title, description, capacity, labelIds } = request;
		const eventRequest = new EventOneOffTimeslotRequest();
		eventRequest.title = title || previousState.title;
		eventRequest.capacity = capacity || previousState.capacity;
		eventRequest.description = description || previousState.description;
		eventRequest.labelIds = labelIds;
		eventRequest.timeslot = oneOffTimeslot;

		return eventRequest;
	}

	public mapEventTimeslotToOneOffTimeslot(request: EventTimeslotRequest): OneOffTimeslot {
		const { startDateTime, endDateTime, idSigned, serviceProviderId } = request;
		const oneOffTimeslot = new OneOffTimeslot();
		oneOffTimeslot.endDateTime = endDateTime;
		oneOffTimeslot.startDateTime = startDateTime;
		oneOffTimeslot.serviceProviderId = serviceProviderId;
		oneOffTimeslot.id = this.idHasher.decode(idSigned);
		return oneOffTimeslot;
	}

	public mapDependenciesToModel(event: Event, { service, labels }: EventDependencies) {
		event.service = service;
		event.labels = labels;
		return event;
	}

	private mapOneOffTimeslotsToEvent(timeslot: OneOffTimeslot[]): EventTimeslotResponse[] {
		return timeslot.map(
			({ id, startDateTime, endDateTime, serviceProvider }) =>
				({
					idSigned: this.idHasher.encode(id),
					startDateTime,
					endDateTime,
					serviceProvider: { id: this.idHasher.encode(serviceProvider.id), name: serviceProvider.name },
				} as EventTimeslotResponse),
		);
	}

	public mapToResponse(model: Event): EventResponse {
		const { id, service, title, description, capacity, labels, oneOffTimeslots } = model;
		const labelRes = this.labelsMapper.mapToLabelsResponse(labels);
		const sortStartDates = sortDate(oneOffTimeslots.map((slot) => slot.startDateTime));
		const sortEndDate = sortDate(oneOffTimeslots.map((slot) => slot.endDateTime));
		return {
			id: this.idHasher.encode(id),
			service: ServicesMapper.modelToServiceSummaryModel(service),
			title,
			description,
			capacity,
			labels: labelRes,
			firstStartDateTime: sortStartDates[0],
			lastEndDateTime: sortEndDate[sortEndDate.length - 1],
			timeslots: this.mapOneOffTimeslotsToEvent(oneOffTimeslots),
		} as EventResponse;
	}
}

type EventDependencies = {
	service?: Service;
	labels?: Label[];
	oneOffTimeslots?: OneOffTimeslot[];
};
