import { Organisation, ServiceProviderLabelCategory } from '../../../models/entities';
import { OrganisationSPLabelsService, SPLabelsCategoriesService } from '../serviceProvidersLabels.service';

export class SPLabelsCategoriesServiceMock implements Partial<SPLabelsCategoriesService> {
	public static sortSPLabelForDeleteCategory = jest.fn();
	public static updateSPLabelToNoCategory = jest.fn();
	public static updateSPLabel = jest.fn<Promise<ServiceProviderLabelCategory[]>, any>();

	public sortSPLabelForDeleteCategory(...param) {
		return SPLabelsCategoriesServiceMock.sortSPLabelForDeleteCategory(...param);
	}

	public async updateSPLabelToNoCategory(...param) {
		return await SPLabelsCategoriesServiceMock.updateSPLabelToNoCategory(...param);
	}

	public async updateSPLabel(...params): Promise<ServiceProviderLabelCategory[]> {
		return await SPLabelsCategoriesServiceMock.updateSPLabel(...params);
	}
}

export class OrganisationSPLabelsServiceMock implements Partial<OrganisationSPLabelsService> {
	public static getOrgServiceProviderLabels = jest.fn<Promise<Organisation>, any>();
	public static updateOrgServiceProviderLabels = jest.fn<Promise<Organisation>, any>();

	public async getOrgServiceProviderLabels(orgId: number): Promise<Organisation> {
		return await OrganisationSPLabelsServiceMock.getOrgServiceProviderLabels(orgId);
	}

	public async updateOrgServiceProviderLabels(...param): Promise<Organisation> {
		return await OrganisationSPLabelsServiceMock.updateOrgServiceProviderLabels(...param);
	}
}
