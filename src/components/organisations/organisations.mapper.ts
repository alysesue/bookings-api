import { Organisation } from '../../models/entities';
import { Inject, InRequestScope } from 'typescript-ioc';
import { OrganisationSettingsResponse } from './organisations.apicontract';
import { SPLabelsCategoriesMapper } from '../serviceProvidersLabels/serviceProvidersLabels.mapper';
import { ServiceProviderLabelResponse } from '../serviceProvidersLabels/serviceProvidersLabels.apicontract';

@InRequestScope
export class OrganisationsMapper {
	@Inject
	private spLabelsCategoriesMapper: SPLabelsCategoriesMapper;

	public mapToOrganisationSettings(organisation: Organisation): OrganisationSettingsResponse {
		const response = new OrganisationSettingsResponse();
		const labelSettings = new ServiceProviderLabelResponse();

		labelSettings.labels = this.spLabelsCategoriesMapper.mapToServiceProviderLabelsResponse(organisation.labels);
		labelSettings.categories = this.spLabelsCategoriesMapper.mapToCategoriesResponse(organisation.categories);
		response.labelSettings = labelSettings;

		return response;
	}
}
