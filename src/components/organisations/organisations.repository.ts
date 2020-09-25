import { InRequestScope } from 'typescript-ioc';
import { Organisation } from '../../models';
import { RepositoryBase } from '../../core/repository';

@InRequestScope
export class OrganisationsRepository extends RepositoryBase<Organisation> {
	constructor() {
		super(Organisation);
	}

	public async save(organisation: Organisation): Promise<Organisation> {
		return await (await this.getRepository()).save(organisation);
	}

	public async getOrganisationsForUserGroups(organisationRefs: string[]): Promise<Organisation[]> {
		if (!organisationRefs || organisationRefs.length === 0) {
			return [];
		}

		const repository = await this.getRepository();
		// *** Don't filter by user permission here, as this is used by UserContext class
		const query = repository
			.createQueryBuilder('org')
			.innerJoinAndSelect(
				'org._organisationAdminGroupMap',
				'orggroup',
				'orggroup."_organisationRef" IN (:...organisationRefs)',
				{
					organisationRefs,
				},
			);

		return await query.getMany();
	}
}
