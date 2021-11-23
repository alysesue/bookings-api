import { Organisation } from '../../../models/entities';
import { OrganisationSettingsResponse } from '../organisations.apicontract';
import { OrganisationsMapper } from '../organisations.mapper';
import {ServiceProviderLabelResponse} from "../../serviceProvidersLabels/serviceProvidersLabels.apicontract";

export class OrganisationsMapperMock implements Partial<OrganisationsMapper> {
	public static mapToOrganisationSettings = jest.fn<OrganisationSettingsResponse, any>();
	public static mapToOrganisationLabels = jest.fn<ServiceProviderLabelResponse, any>();

	public mapToOrganisationSettings(organisation: Organisation): OrganisationSettingsResponse {
		return OrganisationsMapperMock.mapToOrganisationSettings(organisation);
	}

	public mapToOrganisationLabels(...params):ServiceProviderLabelResponse {
		return OrganisationsMapperMock.mapToOrganisationLabels(...params);
	}
}
