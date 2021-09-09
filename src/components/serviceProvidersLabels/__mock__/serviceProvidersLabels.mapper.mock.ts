import { ServiceProviderLabel, ServiceProviderLabelCategory } from '../../../models/entities';
import {
	ServiceProviderLabelCategoryRequestModel,
	ServiceProviderLabelCategoryResponseModel,
	ServiceProviderLabelRequestModel,
	ServiceProviderLabelResponseModel,
} from '../serviceProvidersLabels.apicontract';
import { SPLabelsCategoriesMapper } from '../serviceProvidersLabels.mapper';

export class SPLabelsCategoriesMapperMock implements Partial<SPLabelsCategoriesMapper> {
	public static mapToServiceProviderLabelsResponse = jest.fn<ServiceProviderLabelResponseModel[], any>();
	public static mapToServiceProviderLabels = jest.fn<ServiceProviderLabel[], any>();
	public static mapToCategoriesResponse = jest.fn<ServiceProviderLabelCategoryResponseModel[], any>();
	public static mapToServiceProviderCategories = jest.fn<ServiceProviderLabelCategory[], any>();
	public static mergeAllLabels = jest.fn<ServiceProviderLabel[], any>();

	public mapToServiceProviderLabelsResponse(data: ServiceProviderLabel[]): ServiceProviderLabelResponseModel[] {
		return SPLabelsCategoriesMapperMock.mapToServiceProviderLabelsResponse(data);
	}

	public mapToServiceProviderLabels(labels: ServiceProviderLabelRequestModel[]): ServiceProviderLabel[] {
		return SPLabelsCategoriesMapperMock.mapToServiceProviderLabels(labels);
	}

	public mapToCategoriesResponse(data: ServiceProviderLabelCategory[]): ServiceProviderLabelCategoryResponseModel[] {
		return SPLabelsCategoriesMapperMock.mapToCategoriesResponse(data);
	}

	public mapToServiceProviderCategories(
		request: ServiceProviderLabelCategoryRequestModel[],
	): ServiceProviderLabelCategory[] {
		return SPLabelsCategoriesMapperMock.mapToServiceProviderCategories(request);
	}

	public mergeAllLabels(...param): ServiceProviderLabel[] {
		return SPLabelsCategoriesMapperMock.mergeAllLabels(...param);
	}
}
