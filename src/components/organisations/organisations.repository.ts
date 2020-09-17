import { InRequestScope } from 'typescript-ioc';
import { Organisation } from '../../models';
import { RepositoryBase } from '../../core/repository';

@InRequestScope
export class OrganisationsRepository extends RepositoryBase<Organisation> {
	constructor() {
		super(Organisation);
	}

	public async getOrganisationsForUserGroups(userGroups: string[]): Promise<Organisation[]> {
		if (!userGroups || userGroups.length === 0) {
			return [];
		}

		const repository = await this.getRepository();
		// *** Don't filter by user permission here, as this is used by UserContext class
		const query = repository
			.createQueryBuilder('org')
			.innerJoinAndSelect(
				'org._organisationAdminGroupMap',
				'orggroup',
				'orggroup."_userGroupRef" IN (:...userGroups)',
				{
					userGroups,
				},
			)
			.orderBy('org._id');

		return await query.getMany();
	}
}
