import { Inject, InRequestScope } from 'typescript-ioc';
import { Organisation } from '../../models';
import { RepositoryBase } from '../../core/repository';

import {
	ServiceProviderLabelsRepository,
	ServiceProviderLabelsCategoriesRepository,
} from '../serviceProvidersLabels/serviceProvidersLabels.repository';

@InRequestScope
export class OrganisationsNoauthRepository extends RepositoryBase<Organisation> {
	@Inject
	private spLabelsRepository: ServiceProviderLabelsRepository;
	@Inject
	private spCategoriesLabelsRepository: ServiceProviderLabelsCategoriesRepository;

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

	public async getOrganisationById(
		orgaId: number,
		options?: {
			includeLabels?: boolean;
			includeLabelCategories?: boolean;
		},
	): Promise<Organisation> {
		const repository = await this.getRepository();

		const query = repository
			.createQueryBuilder('org')
			.innerJoinAndSelect('org._organisationAdminGroupMap', 'orggroup', 'org."_id" = :orgaId', {
				orgaId,
			});

		const entry = await query.getOne();
		if (!entry) {
			return entry;
		}

		if (options?.includeLabels) await this.spLabelsRepository.populateLabelForOrganisation([entry]);
		if (options?.includeLabelCategories) await this.spCategoriesLabelsRepository.populateCategories([entry]);
		return entry;
	}
}
