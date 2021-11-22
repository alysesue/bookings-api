import { MOLErrorV2, ErrorCodeV2 } from 'mol-lib-api-contract';
import { TransactionManager, DefaultIsolationLevel } from '../../../src/core/transactionManager';
import { CrudAction } from '../../../src/enums/crudAction';
import { UserContext } from '../../../src/infrastructure/auth/userContext';
import {Organisation, ServiceProviderLabel, ServiceProviderLabelCategory} from '../../../src/models';
import { InRequestScope, Inject } from 'typescript-ioc';
import { OrganisationsNoauthRepository } from '../organisations/organisations.noauth.repository';
import { SPLabelsCategoriesMapper } from '../serviceProvidersLabels/serviceProvidersLabels.mapper';
import { SPLabelsCategoriesService } from '../serviceProvidersLabels/serviceProvidersLabels.service';
import { OrganisationSettingsRequest } from '../organisations/organisations.apicontract';
import {
	OrganisationsActionAuthVisitor,
	OrganisationsAuthAction,
	OrganisationsAuthOtherAction
} from "./organisations.auth";

@InRequestScope
export class OrganisationSettingsService {
	@Inject
	private transactionManager: TransactionManager;
	@Inject
	private organisationsRepository: OrganisationsNoauthRepository;
	@Inject
	private spLabelsCategoriesMapper: SPLabelsCategoriesMapper;
	@Inject
	private spLabelsCategoriesService: SPLabelsCategoriesService;
	@Inject
	private userContext: UserContext;

	private async fetchOrgSettings(orgId: number): Promise<Organisation> {
		const organisation = await this.organisationsRepository.getOrganisationById(orgId, {
			includeLabels: true,
			includeLabelCategories: true,
		});
		if (!organisation) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Organisation not found');
		}
		return organisation

	}
	public async getOrgSettings(orgId: number): Promise<Organisation> {
		const organisation = await this.fetchOrgSettings(orgId);
		await this.verifyActionPermission(organisation, CrudAction.Read);
		return organisation;
	}

	public async getLabels(orgId: number): Promise<{labels: ServiceProviderLabel[], categories:ServiceProviderLabelCategory[]} > {
		const organisation = await this.fetchOrgSettings(orgId);
		await this.verifyActionPermission(organisation, OrganisationsAuthOtherAction.someRead);
		return {labels: organisation.labels, categories: organisation.categories};
	}

	public async updateOrgSettings(orgId: number, request: OrganisationSettingsRequest): Promise<Organisation> {
		const organisation = await this.organisationsRepository.getOrganisationById(orgId, {
			includeLabels: true,
			includeLabelCategories: true,
		});
		if (!organisation) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Organisation not found');
		}

		await this.verifyActionPermission(organisation, CrudAction.Update);

		const updatedLabelList = this.spLabelsCategoriesMapper.mapToServiceProviderLabels(request.labelSettings.labels);
		this.spLabelsCategoriesMapper.mergeAllLabels(organisation.labels, updatedLabelList);
		const updatedCategoriesList = this.spLabelsCategoriesMapper.mapToServiceProviderCategories(
			request.labelSettings.categories,
		);

		try {
			return await this.transactionManager.runInTransaction(DefaultIsolationLevel, async () => {
				organisation.categories = await this.spLabelsCategoriesService.updateSPLabel(
					organisation,
					updatedCategoriesList,
					updatedLabelList,
				);

				return await this.organisationsRepository.save(organisation);
			});
		} catch (e) {
			if (e.message.startsWith('duplicate key value violates unique constraint')) {
				if (e.message.includes('ServiceProviderLabels')) {
					throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Label(s) are already present');
				}
				if (e.message.includes('ServiceProviderCategories')) {
					throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Category(ies) are already present');
				}
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
					'Service Provider name is already present',
				);
			}
		}
	}

	private async verifyActionPermission(organisation: Organisation, action: OrganisationsAuthAction): Promise<void> {
		const authGroups = await this.userContext.getAuthGroups();
		if (!new OrganisationsActionAuthVisitor(organisation, action).hasPermission(authGroups)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
				`User cannot perform this organisation action (${action}) for this org. Organisation: ${organisation.name}`,
			);
		}
	}
}
