import { logger } from 'mol-lib-common';
import { TransactionManager } from '../../core/transactionManager';
import { Inject, InRequestScope } from 'typescript-ioc';
import { Organisation, OrganisationAdminGroupMap } from '../../models';
import { OrganisationsRepository } from './organisations.repository';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

const DefaultIsolationLevel: IsolationLevel = 'READ COMMITTED';

@InRequestScope
export class OrganisationsService {
	@Inject
	private transactionManager: TransactionManager;
	@Inject
	private organisationsRepository: OrganisationsRepository;

	private getFirstOrNull<T>(data: T[]): T {
		if (data && data.length > 0) {
			return data[0];
		}
		return null;
	}

	private async createOrganisation(organisationInfo: OrganisationInfo): Promise<Organisation> {
		let organisation;
		try {
			const newOrg = new Organisation();
			// Organisation name will have organisationRef as the initial value, but it may change later.
			newOrg.name = organisationInfo.organisationRef;
			const groupMap = new OrganisationAdminGroupMap();
			groupMap.organisationRef = organisationInfo.organisationRef;
			newOrg._organisationAdminGroupMap = groupMap;

			this.transactionManager.runInTransaction(DefaultIsolationLevel, async () => {
				await this.organisationsRepository.save(newOrg);
			});
		} catch (e) {
			// concurrent insert fail case
			logger.warn(`Exception when creating Organisation: ${organisationInfo.organisationRef}`, e);
		}

		organisation = this.getFirstOrNull(
			await this.organisationsRepository.getOrganisationsForUserGroups([organisationInfo.organisationRef]),
		);
		return organisation;
	}

	public async getOrganisationsForGroups(data: OrganisationInfo[]): Promise<Organisation[]> {
		const organisationRefs = data.map((g) => g.organisationRef);
		const organisations = await this.organisationsRepository.getOrganisationsForUserGroups(organisationRefs);

		const notFoundOrgs = data.filter(
			(role) => !organisations.find((s) => s._organisationAdminGroupMap.organisationRef === role.organisationRef),
		);

		for (const notFoundOrg of notFoundOrgs) {
			const newOrg = await this.createOrganisation(notFoundOrg);
			if (newOrg) {
				organisations.push(newOrg);
			}
		}

		organisations.sort((a, b) => a.id - b.id);
		return organisations;
	}
}

export type OrganisationInfo = {
	organisationRef: string;
};
