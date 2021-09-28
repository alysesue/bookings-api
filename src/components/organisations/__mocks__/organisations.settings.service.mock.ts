import { Organisation } from '../../../models';
import { OrganisationSettingsService } from '../organisations.settings.service';

export class OrganisationSettingsServiceMock implements Partial<OrganisationSettingsService> {
	public static getOrgSettings = jest.fn<Promise<Organisation>, any>();
	public static updateOrgSettings = jest.fn<Promise<Organisation>, any>();

	public async getOrgSettings(orgId: number): Promise<Organisation> {
		return await OrganisationSettingsServiceMock.getOrgSettings(orgId);
	}

	public async updateOrgSettings(...param): Promise<Organisation> {
		return await OrganisationSettingsServiceMock.updateOrgSettings(...param);
	}
}
