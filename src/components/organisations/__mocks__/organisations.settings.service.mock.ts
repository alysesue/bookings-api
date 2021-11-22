import {Organisation, ServiceProviderLabel, ServiceProviderLabelCategory} from '../../../models';
import { OrganisationSettingsService } from '../organisations.settings.service';

export class OrganisationSettingsServiceMock implements Partial<OrganisationSettingsService> {
	public static getOrgSettings = jest.fn<Promise<Organisation>, any>();
	public static updateOrgSettings = jest.fn<Promise<Organisation>, any>();
	public static getLabels = jest.fn<Promise<{labels: ServiceProviderLabel[], categories:ServiceProviderLabelCategory[]}>, any>();

	public async getOrgSettings(orgId: number): Promise<Organisation> {
		return await OrganisationSettingsServiceMock.getOrgSettings(orgId);
	}

	public async updateOrgSettings(...param): Promise<Organisation> {
		return await OrganisationSettingsServiceMock.updateOrgSettings(...param);
	}

	public async getLabels(...param): Promise<{labels: ServiceProviderLabel[], categories:ServiceProviderLabelCategory[]}> {
		return await OrganisationSettingsServiceMock.getLabels(...param);

	}
}
