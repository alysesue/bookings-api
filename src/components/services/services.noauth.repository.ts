import { InRequestScope } from 'typescript-ioc';
import { Service } from '../../models';
import { RepositoryBase } from '../../core/repository';

// Repository access without authorisation (used by UserContext)
@InRequestScope
export class ServicesRepositoryNoAuth extends RepositoryBase<Service> {
	constructor() {
		super(Service);
	}

	public async getServicesForUserGroups(serviceInfos: ServiceRefInfo[]): Promise<Service[]> {
		if (!serviceInfos || serviceInfos.length === 0) {
			return [];
		}

		const references = serviceInfos.map((r) => `${r.serviceRef}:${r.organisationRef}`);

		const repository = await this.getRepository();
		// *** Don't filter by user permission here, as this is used by UserContext class
		const query = repository
			.createQueryBuilder('svc')
			.innerJoinAndSelect(
				'svc._serviceAdminGroupMap',
				'svcgroup',
				'svcgroup."_serviceOrganisationRef" IN (:...references)',
				{
					references,
				},
			);

		return await query.getMany();
	}
}

export type ServiceRefInfo = {
	serviceRef: string;
	organisationRef: string;
};
