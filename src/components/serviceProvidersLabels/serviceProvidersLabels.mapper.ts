import { ServiceProviderLabel, ServiceProviderLabelCategory } from '../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import { IdHasher } from '../../infrastructure/idHasher';
import { LabelsMapper } from '../labels/labels.mapper';
import { LabelResponse } from '../labels/label.enum';
import {
	ServiceProviderLabelRequestModel,
	ServiceProviderLabelCategoryRequestModel,
	ServiceProviderLabelResponseModel,
	ServiceProviderLabelCategoryResponseModel,
} from './serviceProvidersLabels.apicontract';

@InRequestScope
export class SPLabelsCategoriesMapper {
	@Inject
	private labelsMapper: LabelsMapper;
	@Inject
	private idHasher: IdHasher;

	public mapToServiceProviderLabelsResponse(data: ServiceProviderLabel[] = []): ServiceProviderLabelResponseModel[] {
		return data.map((i) => {
			const labelData = new ServiceProviderLabelResponseModel();
			labelData.id = this.idHasher.encode(i.id);
			labelData.name = i.labelText;
			labelData.organisationId = this.idHasher.encode(i.organisationId);
			return labelData;
		});
	}

	public mapToServiceProviderLabels(labels: ServiceProviderLabelRequestModel[] = []): ServiceProviderLabel[] {
		return this.labelsMapper.genericMappingLabels(labels, LabelResponse.SERVICE_PROVIDER) as ServiceProviderLabel[];
	}

	public mergeAllLabels(
		originalList: ServiceProviderLabel[],
		updatedList: ServiceProviderLabel[],
	): ServiceProviderLabel[] {
		return this.labelsMapper.mergeAllLabels(originalList, updatedList) as ServiceProviderLabel[];
	}

	public mapToCategoriesResponse(
		data: ServiceProviderLabelCategory[] = [],
	): ServiceProviderLabelCategoryResponseModel[] {
		return data.map((i) => {
			const categoryData = new ServiceProviderLabelCategoryResponseModel();
			categoryData.id = this.idHasher.encode(i.id);
			categoryData.categoryName = i.name;
			categoryData.labels = this.mapToServiceProviderLabelsResponse(i.labels);
			categoryData.organisationId = this.idHasher.encode(i.organisationId);
			return categoryData;
		});
	}

	public mapToServiceProviderCategories(
		request: ServiceProviderLabelCategoryRequestModel[] = [],
	): ServiceProviderLabelCategory[] {
		request = request.filter((v, i, a) => a.findIndex((t) => t.categoryName === v.categoryName) === i);
		return request.map((i) => {
			const entity = new ServiceProviderLabelCategory();
			if (i.id) {
				entity.id = this.idHasher.decode(i.id);
			}
			entity.name = i.categoryName;
			entity.labels = this.mapToServiceProviderLabels(i.labels);
			return entity;
		});
	}
}
