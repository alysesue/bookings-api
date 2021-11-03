import {
	OrganisationSettingsRequest,
	OrganisationSettingsResponse,
} from '../../../src/components/organisations/organisations.apicontract';
import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { getMe } from './users';

export const putOrganisationSettings = async (
	settings: OrganisationSettingsRequest,
	orgId?: string,
): Promise<OrganisationSettingsResponse> => {
	let organisationId = orgId;
	if (!orgId) {
		const me = await getMe();
		organisationId = me.groups[0].organisations[0].id;
	}
	const res = await OrganisationAdminRequestEndpointSG.create({}).put(
		`organisations/${organisationId}/settings`,
		{
			body: { ...settings },
		},
		'V2',
	);

	return res.body.data;
};
