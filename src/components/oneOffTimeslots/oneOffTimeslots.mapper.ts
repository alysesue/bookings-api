import { Inject } from 'typescript-ioc';
import { Event, OneOffTimeslot, ServiceProvider } from '../../models';
import { IdHasher } from '../../infrastructure/idHasher';
import { LabelsMapper } from '../labels/labels.mapper';
import { OneOffTimeslotRequestV1, OneOffTimeslotResponse } from './oneOffTimeslots.apicontract';

export class OneOffTimeslotsMapper {
	@Inject
	private idHasher: IdHasher;
	@Inject
	private labelMapper: LabelsMapper;

	public mapToOneOffTimeslots(
		request: OneOffTimeslotRequestV1,
		entity = new OneOffTimeslot(),
		serviceProvider: ServiceProvider,
	): OneOffTimeslot {
		entity.startDateTime = new Date(request.startDateTime);
		entity.endDateTime = new Date(request.endDateTime);
		entity.serviceProvider = serviceProvider;
		return entity;
	}

	public mapDependenciesToOneOffTimeslots(
		oneOffTimeslot: OneOffTimeslot,
		serviceProvider: ServiceProvider,
	): OneOffTimeslot {
		oneOffTimeslot.serviceProvider = serviceProvider;
		return oneOffTimeslot;
	}

	public mapDataModel(event: Event): OneOffTimeslotResponse {
		const response = new OneOffTimeslotResponse();
		response.idSigned = this.idHasher.encode(event.id);
		response.startDateTime = event.oneOffTimeslots[0].startDateTime;
		response.endDateTime = event.oneOffTimeslots[0].endDateTime;
		response.capacity = event.capacity;
		response.labels = this.labelMapper.mapToLabelsResponse(event.labels);
		response.title = event.title ?? undefined;
		response.description = event.description ?? undefined;

		return response;
	}
}
