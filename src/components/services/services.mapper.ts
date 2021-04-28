import { Inject } from 'typescript-ioc';
import { Service } from '../../models/entities';
import { LabelsMapper } from '../labels/labels.mapper';
import { ServiceResponse } from './service.apicontract';

export class ServicesMapper {
	@Inject
	private labelsMapper: LabelsMapper;

	public mapToServiceResponse(service: Service) {
		const serviceResponse = new ServiceResponse();
		serviceResponse.id = service.id;
		serviceResponse.name = service.name;
		serviceResponse.isStandAlone = service.isStandAlone;
		serviceResponse.isSpAutoAssigned = service.isSpAutoAssigned;
		serviceResponse.labels = this.labelsMapper.mapToLabelsResponse(service.labels);
		serviceResponse.emailSuffix = service.emailSuffix;
		return serviceResponse;
	}
}
