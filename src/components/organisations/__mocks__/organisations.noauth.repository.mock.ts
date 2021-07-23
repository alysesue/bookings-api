import { Organisation } from '../../../models/entities';
import { OrganisationsNoauthRepository } from '../organisations.noauth.repository';

export class OrganisationsRepositoryMock implements Partial<OrganisationsNoauthRepository> {
	public static getOrganisationsForUserGroups = jest.fn();
	public static sort = jest.fn();
	public static save = jest.fn<Promise<Organisation>, any>();
	public static getOrganisationById = jest.fn();

	public async getOrganisationsForUserGroups(...params): Promise<any> {
		return await OrganisationsRepositoryMock.getOrganisationsForUserGroups(...params);
	}
	public async sort(...params): Promise<any> {
		return await OrganisationsRepositoryMock.sort(...params);
	}
	public async save(...params): Promise<any> {
		return await OrganisationsRepositoryMock.save(...params);
	}
	public async getOrganisationById(orgaId: number): Promise<Organisation> {
		return await OrganisationsRepositoryMock.getOrganisationById(orgaId);
	}
}
