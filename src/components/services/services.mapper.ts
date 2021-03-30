import { Service } from '../../models/entities';
import { ServiceResponse } from './service.apicontract';
import { Inject } from 'typescript-ioc';
import { LabelsMapper } from '../labels/labels.mapper';

export class ServicesMapper {
	@Inject
	private labelsMapper: LabelsMapper;

	public mapToServiceResponse(service: Service) {
		const serviceResponse = new ServiceResponse();
		serviceResponse.id = service.id;
		serviceResponse.name = service.name;
		serviceResponse.isStandAlone = service.isStandAlone;
		serviceResponse.labels = this.labelsMapper.mapToLabelsResponse(service.labels);
		return serviceResponse;
	}
}
