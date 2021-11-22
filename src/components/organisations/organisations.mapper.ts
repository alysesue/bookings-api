import {Organisation, ServiceProviderLabel, ServiceProviderLabelCategory} from '../../models/entities';
import {Inject, InRequestScope} from 'typescript-ioc';
import {OrganisationSettingsResponse} from './organisations.apicontract';
import {SPLabelsCategoriesMapper} from '../serviceProvidersLabels/serviceProvidersLabels.mapper';
import {ServiceProviderLabelResponse} from '../serviceProvidersLabels/serviceProvidersLabels.apicontract';

@InRequestScope
export class OrganisationsMapper {
	@Inject
	private spLabelsCategoriesMapper: SPLabelsCategoriesMapper;

	private mapToLabels(labels: ServiceProviderLabel[], categories: ServiceProviderLabelCategory[]): ServiceProviderLabelResponse{
		const labelSettings = new ServiceProviderLabelResponse();
		labelSettings.labels = this.spLabelsCategoriesMapper.mapToServiceProviderLabelsResponse(labels);
		labelSettings.categories = this.spLabelsCategoriesMapper.mapToCategoriesResponse(categories);
		return labelSettings;

	}

	public mapToOrganisationSettings(organisation: Organisation): OrganisationSettingsResponse {
		const response = new OrganisationSettingsResponse();
		const labelSettings = new ServiceProviderLabelResponse();

		labelSettings.labels = this.spLabelsCategoriesMapper.mapToServiceProviderLabelsResponse(organisation.labels);
		labelSettings.categories = this.spLabelsCategoriesMapper.mapToCategoriesResponse(organisation.categories);
		response.labelSettings = this.mapToLabels(organisation.labels, organisation.categories);

		return response;
	}

	public mapToOrganisationLabels(labels: ServiceProviderLabel[], categories: ServiceProviderLabelCategory[]): ServiceProviderLabelResponse{
	    return this.mapToLabels(labels, categories)
	}
}
