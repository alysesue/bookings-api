import { Organisation, ServiceProviderLabel, ServiceProviderLabelCategory } from '../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import { LabelsService } from '../labels/labels.service';
import { LabelResponse } from '../labels/label.enum';
import { LabelsCategoriesService } from '../labelsCategories/labelsCategories.service';
import { MOLErrorV2, ErrorCodeV2 } from 'mol-lib-api-contract';
import { DefaultIsolationLevel, TransactionManager } from '../../core/transactionManager';
import { OrganisationsNoauthRepository } from '../organisations/organisations.noauth.repository';
import { SPLabelsCategoriesMapper } from './serviceProvidersLabels.mapper';
import { CrudAction } from '../../enums/crudAction';
import { ServiceProvidersLabelsActionAuthVisitor } from './serviceProvidersLabels.auth';
import { UserContext } from '../../infrastructure/auth/userContext';
import { ServiceProviderLabelRequest } from './serviceProvidersLabels.apicontract';

@InRequestScope
export class SPLabelsCategoriesService {
	@Inject
	private labelsService: LabelsService;
	@Inject
	private labelsCategoriesService: LabelsCategoriesService;

	public sortSPLabelForDeleteCategory(
		labelsNoCategory: ServiceProviderLabel[],
		labelsCategory: ServiceProviderLabel[],
	): { movedLabelsToNoCategory: ServiceProviderLabel[]; deleteLabels: ServiceProviderLabel[] } {
		return this.labelsService.genericSortLabelForDeleteCategory(labelsNoCategory, labelsCategory) as {
			movedLabelsToNoCategory: ServiceProviderLabel[];
			deleteLabels: ServiceProviderLabel[];
		};
	}

	public async updateSPLabelToNoCategory(
		labels: ServiceProviderLabel[],
		organisation: Organisation,
	): Promise<ServiceProviderLabel[]> {
		labels.forEach((label) => {
			label.categoryId = null;
			label.organisationId = organisation.id;
		});

		const updateLabel = (await this.labelsService.update(
			labels,
			LabelResponse.SERVICE_PROVIDER,
		)) as ServiceProviderLabel[];
		return [...organisation.labels, ...updateLabel];
	}

	public async updateSPLabel(
		organisation: Organisation,
		updatedCategories: ServiceProviderLabelCategory[],
		updatedLabel: ServiceProviderLabel[],
	): Promise<ServiceProviderLabelCategory[]> {
		const { newCategories, updateOrKeepCategories, deleteCategories } = this.sortUpdateSPCategories(
			organisation.categories,
			updatedCategories,
			organisation.id,
		);

		const allLabelsOfDeleteCategories = [...deleteCategories.map((cat) => cat.labels)].flat(1);
		const { movedLabelsToNoCategory, deleteLabels } = this.sortSPLabelForDeleteCategory(
			updatedLabel,
			allLabelsOfDeleteCategories,
		);
		organisation.labels = await this.updateSPLabelToNoCategory(movedLabelsToNoCategory, organisation);
		await this.labelsService.delete(deleteLabels, LabelResponse.SERVICE_PROVIDER);
		await this.labelsCategoriesService.delete(deleteCategories, LabelResponse.SERVICE_PROVIDER);
		return (await this.labelsCategoriesService.save(
			[...newCategories, ...updateOrKeepCategories],
			LabelResponse.SERVICE_PROVIDER,
		)) as ServiceProviderLabelCategory[];
	}

	private sortUpdateSPCategories(
		originalList: ServiceProviderLabelCategory[],
		updatedList: ServiceProviderLabelCategory[],
		organisationId: number,
	): {
		newCategories: ServiceProviderLabelCategory[];
		updateOrKeepCategories: ServiceProviderLabelCategory[];
		deleteCategories: ServiceProviderLabelCategory[];
	} {
		const newCategories = updatedList
			.filter((category) => !category.id)
			.map((category) => {
				category.organisationId = organisationId;
				return category;
			});
		const updateOrKeepCategories = updatedList.filter((category) =>
			originalList.some((origCatego) => origCatego.id === category.id),
		);
		const deleteCategories = originalList.filter(
			(category) => !updatedList.some((origCatego) => origCatego.id === category.id),
		);
		return { newCategories, updateOrKeepCategories, deleteCategories };
	}
}

@InRequestScope
export class OrganisationSPLabelsService {
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

	public async getOrgServiceProviderLabels(orgId: number): Promise<Organisation> {
		const organisation = await this.organisationsRepository.getOrganisationById(orgId, {
			includeLabels: true,
			includeLabelCategories: true,
		});
		if (!organisation) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Organisation not found');
		}
		await this.verifyActionPermission(organisation, CrudAction.Read);

		return organisation;
	}

	public async updateOrgServiceProviderLabels(
		orgId: number,
		request: ServiceProviderLabelRequest,
	): Promise<Organisation> {
		const organisation = await this.organisationsRepository.getOrganisationById(orgId, {
			includeLabels: true,
			includeLabelCategories: true,
		});
		if (!organisation) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Organisation not found');
		}

		await this.verifyActionPermission(organisation, CrudAction.Update);

		const updatedLabelList = this.spLabelsCategoriesMapper.mapToServiceProviderLabels(request.labels);
		this.spLabelsCategoriesMapper.mergeAllLabels(organisation.labels, updatedLabelList);
		const updatedCategoriesList = this.spLabelsCategoriesMapper.mapToServiceProviderCategories(request.categories);

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

	private async verifyActionPermission(organisation: Organisation, action: CrudAction): Promise<void> {
		const authGroups = await this.userContext.getAuthGroups();
		if (!new ServiceProvidersLabelsActionAuthVisitor(organisation, action).hasPermission(authGroups)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
				`User cannot perform this organisation action (${action}) for this org. Organisation: ${organisation.name}`,
			);
		}
	}
}
