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
import { Event } from '../../models';
import { Label, OneOffTimeslot, Service } from '../../models';
import { OneOffTimeslotRequestV1 } from '../oneOffTimeslots/oneOffTimeslots.apicontract';
import { LabelsMapper } from '../labels/labels.mapper';
import { ServicesMapper } from '../services/services.mapper';

@InRequestScope
export class EventsMapper {
	@Inject
	private idHasher: IdHasher;
	@Inject
	private labelsMapper: LabelsMapper;
	@Inject
	private servicesMapper: ServicesMapper;

	public mapToModel(request: IEventRequest): Event {
		const { serviceId, title, description, capacity } = request;
		const event = new Event();
		event.serviceId = this.idHasher.decode(serviceId);
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
		const { startDateTime, endDateTime, id, serviceProviderId } = request;
		const oneOffTimeslot = new OneOffTimeslot();
		oneOffTimeslot.endDateTime = endDateTime;
		oneOffTimeslot.startDateTime = startDateTime;
		oneOffTimeslot.serviceProviderId = this.idHasher.decode(serviceProviderId);
		oneOffTimeslot.id = this.idHasher.decode(id);
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
					id: this.idHasher.encode(id),
					startDateTime,
					endDateTime,
					serviceProvider: { id: this.idHasher.encode(serviceProvider.id), name: serviceProvider.name },
				} as EventTimeslotResponse),
		);
	}

	public mapToResponse(model: Event, availableSlots?: number): EventResponse {
		const {
			id,
			service,
			title,
			description,
			firstStartDateTime,
			lastEndDateTime,
			capacity,
			labels,
			oneOffTimeslots,
		} = model;
		const labelRes = this.labelsMapper.mapToLabelsResponse(labels);
		return {
			id: this.idHasher.encode(id),
			service: this.servicesMapper.modelToServiceSummaryModel(service),
			title,
			description,
			capacity,
			labels: labelRes,
			firstStartDateTime,
			lastEndDateTime,
			timeslots: this.mapOneOffTimeslotsToEvent(oneOffTimeslots),
			availableSlots,
		} as EventResponse;
	}
}

type EventDependencies = {
	service?: Service;
	labels?: Label[];
	oneOffTimeslots?: OneOffTimeslot[];
};
