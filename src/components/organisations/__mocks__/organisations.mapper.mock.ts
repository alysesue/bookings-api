import { Organisation } from '../../../models/entities';
import { OrganisationSettingsResponse } from '../organisations.apicontract';
import { OrganisationsMapper } from '../organisations.mapper';

export class OrganisationsMapperMock implements Partial<OrganisationsMapper> {
	public static mapToOrganisationSettings = jest.fn<OrganisationSettingsResponse, any>();

	public mapToOrganisationSettings(organisation: Organisation): OrganisationSettingsResponse {
		return OrganisationsMapperMock.mapToOrganisationSettings(organisation);
	}
}
