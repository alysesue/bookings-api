import { Inject } from 'typescript-ioc';
import { Service } from '../../models/entities';
import { LabelsMapper } from '../labels/labels.mapper';
import { CategoriesMapper } from '../labelsCategories/categories.mapper';
import { ServiceResponse } from './service.apicontract';

export class ServicesMapper {
	@Inject
	private labelsMapper: LabelsMapper;
	@Inject
	private categoriesMapper: CategoriesMapper;

	public mapToServiceResponse(service: Service) {
		const serviceResponse = new ServiceResponse();
		serviceResponse.id = service.id;
		serviceResponse.name = service.name;
		serviceResponse.isStandAlone = service.isStandAlone;
		serviceResponse.isSpAutoAssigned = service.isSpAutoAssigned;
		serviceResponse.labels = this.labelsMapper.mapToLabelsResponse(service.labels);
		serviceResponse.categories = this.categoriesMapper.mapToCategoriesResponse(service.categories)
		serviceResponse.emailSuffix = service.emailSuffix;
		return serviceResponse;
	}
}
