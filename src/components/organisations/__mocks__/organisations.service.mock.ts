import { Organisation } from '../../../models';
import { OrganisationsService } from '../organisations.service';

export class OrganisationsServiceMock implements Partial<OrganisationsService> {
	public static getOrganisationsForGroups = jest.fn<Promise<Organisation[]>, any>();

	public async getOrganisationsForGroups(...params): Promise<any> {
		return await OrganisationsServiceMock.getOrganisationsForGroups(...params);
	}
}
