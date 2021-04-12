import { Label, OneOffTimeslot, ServiceProvider } from '../../models';
import { OneOffTimeslotRequest, OneOffTimeslotResponse } from './oneOffTimeslots.apicontract';
import { Inject } from 'typescript-ioc';
import { IdHasher } from '../../infrastructure/idHasher';
import { LabelsMapper } from '../labels/labels.mapper';

export class OneOffTimeslotsMapper {
	@Inject
	private idHasher: IdHasher;
	@Inject
	private labelMapper: LabelsMapper;

	public static mapToOneOffTimeslots(
		request: OneOffTimeslotRequest,
		serviceProvider: ServiceProvider,
		labels?: Label[],
	): OneOffTimeslot {
		const entity = new OneOffTimeslot();
		entity.serviceProvider = serviceProvider;
		entity.serviceProviderId = serviceProvider.id;
		entity.startDateTime = request.startDateTime;
		entity.endDateTime = request.endDateTime;
		entity.capacity = request.capacity;
		entity.title = request.title;
		entity.description = request.description;
		entity.labels = labels;

		return entity;
	}

	public mapDataModel(timeslot: OneOffTimeslot): OneOffTimeslotResponse {
		const response = new OneOffTimeslotResponse();
		response.idSigned = this.idHasher.encode(timeslot.id);
		response.startDateTime = timeslot.startDateTime;
		response.endDateTime = timeslot.endDateTime;
		response.capacity = timeslot.capacity;
		response.title = timeslot.title;
		response.description = timeslot.description;
		response.labels = this.labelMapper.mapToLabelsResponse(timeslot.labels);
		return response;
	}
}
