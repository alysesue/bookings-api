import {
	ServiceProviderLabelRequest,
	ServiceProviderLabelResponse,
} from '../serviceProvidersLabels/serviceProvidersLabels.apicontract';

export class OrganisationSettingsRequest {
	labelSettings?: ServiceProviderLabelRequest;
}

export class OrganisationSettingsResponse {
	labelSettings: ServiceProviderLabelResponse;
}
