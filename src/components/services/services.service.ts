import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { Inject, InRequestScope } from 'typescript-ioc';
import {
	Organisation,
	ScheduleForm,
	Service,
	ServiceAdminGroupMap,
	TimeslotItem,
	TimeslotsSchedule,
} from '../../models';
import { ScheduleFormsService } from '../scheduleForms/scheduleForms.service';
import { TimeslotItemRequest } from '../timeslotItems/timeslotItems.apicontract';
import { TimeslotItemsService } from '../timeslotItems/timeslotItems.service';
import { UserContext } from '../../infrastructure/auth/userContext';
import { CrudAction } from '../../enums/crudAction';
import { ScheduleFormRequest } from '../scheduleForms/scheduleForms.apicontract';
import { OrganisationsNoauthRepository } from '../organisations/organisations.noauth.repository';
import { MolUsersService } from '../users/molUsers/molUsers.service';
import { MolServiceAdminUserContract, MolUpsertUsersResult } from '../users/molUsers/molUsers.apicontract';
import { MolUsersMapper } from '../users/molUsers/molUsers.mapper';
import { uniqueStringArray } from '../../tools/collections';
import { LabelsMapper } from '../labels/labels.mapper';
import { LabelsCategoriesMapper } from '../labelsCategories/labelsCategories.mapper';
import { ServicesMapper } from './services.mapper';
import { ServicesActionAuthVisitor } from './services.auth';
import { ServiceRequestV1 } from './service.apicontract';
import { ServicesRepository } from './services.repository';
import { ContainerContext } from '../../infrastructure/containerContext';
import { ServicesValidation } from './services.validation';
import { LabelsCategoriesService } from '../labelsCategories/labelsCategories.service';
import { DefaultIsolationLevel, TransactionManager } from '../../core/transactionManager';

@InRequestScope
export class ServicesService {
	@Inject
	private transactionManager: TransactionManager;
	@Inject
	private servicesRepository: ServicesRepository;
	@Inject
	private categoriesService: LabelsCategoriesService;
	@Inject
	private scheduleFormsService: ScheduleFormsService;
	@Inject
	private timeslotItemsService: TimeslotItemsService;
	@Inject
	private organisationsRepository: OrganisationsNoauthRepository;
	@Inject
	private molUsersService: MolUsersService;
	@Inject
	private userContext: UserContext;
	@Inject
	private labelsMapper: LabelsMapper;
	@Inject
	private containerContext: ContainerContext;
	@Inject
	private categoriesMapper: LabelsCategoriesMapper;
	@Inject
	private servicesMapper: ServicesMapper;

	private getValidator(): ServicesValidation {
		return this.containerContext.resolve(ServicesValidation);
	}

	public async createServices(names: string[], organisation: Organisation): Promise<Service[]> {
		const allServiceNames = uniqueStringArray(names, {
			caseInsensitive: true,
			skipEmpty: true,
			trim: true,
		});

		const existingServices = await this.servicesRepository.getServicesByName({
			names: allServiceNames,
			organisationId: organisation.id,
			skipAuthorisation: true,
		});
		for (const service of existingServices) {
			if (!service.serviceAdminGroupMap) {
				const ref = ServiceAdminGroupMap.createServiceOrganisationRef(
					service.getServiceRef(),
					organisation._organisationAdminGroupMap.organisationRef,
				);
				service.serviceAdminGroupMap = ServiceAdminGroupMap.create(ref);
			}
		}

		const newServices = allServiceNames
			.filter((name) => !existingServices.some((existing) => existing.name.toLowerCase() === name.toLowerCase()))
			.map((s) => Service.create(s, organisation));

		const allServices = [...existingServices, ...newServices];
		await this.servicesRepository.saveMany(allServices);

		return allServices;
	}

	public async createServicesAdmins(
		adminUserContracts?: MolServiceAdminUserContract[],
		authorisationToken?: string,
		desiredDeliveryMediumsHeader?: string,
	): Promise<MolUpsertUsersResult> {
		const orga = await this.userContext.verifyAndGetFirstAuthorisedOrganisation(
			'User not authorized to add services.',
		);
		const serviceNames = [].concat(...adminUserContracts.map((a) => a.serviceNames));
		const services = await this.createServices(serviceNames, orga);

		const molAdminUser = MolUsersMapper.mapServicesAdminsGroups(adminUserContracts, services, orga);
		const res: MolUpsertUsersResult = await this.molUsersService.molUpsertUser(molAdminUser, {
			token: authorisationToken,
			desiredDeliveryMediumsHeader,
		});

		return res;
	}

	public async createService(request: ServiceRequestV1): Promise<Service> {
		const validator = this.getValidator();
		request.name = request.name?.trim();

		const orga = request.organisationId
			? await this.organisationsRepository.getOrganisationById(request.organisationId)
			: await this.userContext.verifyAndGetFirstAuthorisedOrganisation('User not authorized to add services.');

		const transformedLabels = this.labelsMapper.mapToLabels(request.labels);
		const mapToCategories = this.categoriesMapper.mapToCategories(request.categories);
		const service = Service.create(
			request.name,
			orga,
			transformedLabels,
			mapToCategories,
			request.additionalSettings?.bookingLimitation,
		);
		this.servicesMapper.mapToEntityV1(service, request);

		await validator.validate(service);
		await this.verifyActionPermission(service, CrudAction.Create);
		try {
			await this.servicesRepository.save(service);
		} catch (e) {
			if (e.message.startsWith('duplicate key value violates unique constraint')) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Service name is already present');
			}
		}

		return await this.getService(service.id, { includeLabels: true, includeLabelCategories: true });
	}

	public async updateService(id: number, request: ServiceRequestV1): Promise<Service> {
		const validator = this.getValidator();
		const service = await this.servicesRepository.getService({
			id,
			includeLabelCategories: true,
			includeLabels: true,
		});
		await validator.validateServiceFound(service);
		this.servicesMapper.mapToEntityV1(service, request);

		await validator.validate(service);
		await this.verifyActionPermission(service, CrudAction.Update);
		const updatedLabelList = this.labelsMapper.mapToLabels(request.labels);

		this.labelsMapper.mergeAllLabels(service.labels, updatedLabelList);
		const updatedCategoriesList = this.categoriesMapper.mapToCategories(request.categories);

		try {
			return await this.transactionManager.runInTransaction(DefaultIsolationLevel, async () => {
				service.categories = await this.categoriesService.update(
					service,
					updatedCategoriesList,
					updatedLabelList,
				);
				return await this.servicesRepository.save(service);
			});
		} catch (e) {
			if (e.message.startsWith('duplicate key value violates unique constraint')) {
				if (e.message.includes('ServiceLabels')) {
					throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Label(s) are already present');
				}
				if (e.message.includes('ServiceCategories')) {
					throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Category(ies) are already present');
				}
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Service name is already present');
			}
		}
	}

	public async setServiceScheduleForm(id: number, model: ScheduleFormRequest): Promise<ScheduleForm> {
		const service = await this.getService(id);

		const saveEntity = async (e: Service) => {
			return await this.servicesRepository.save(e);
		};

		await this.verifyActionPermission(service, CrudAction.Update);
		await this.scheduleFormsService.updateScheduleFormInEntity(model, service, saveEntity);

		return service.scheduleForm;
	}

	public async getServiceScheduleForm(id: number): Promise<ScheduleForm> {
		const validator = this.getValidator();
		const service = await this.servicesRepository.getService({
			id,
			includeScheduleForm: true,
		});
		await validator.validateServiceFound(service);

		if (!service.scheduleForm) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service scheduleForm not found');
		}

		return service.scheduleForm;
	}

	public async getServices({
		includeScheduleForm = false,
		includeTimeslotsSchedule = false,
		includeLabels = false,
		includeLabelCategories = false,
	} = {}): Promise<Service[]> {
		return await this.servicesRepository.getAll({
			includeLabels,
			includeLabelCategories,
			includeTimeslotsSchedule,
			includeScheduleForm,
		});
	}

	public async getService(
		id: number,
		{
			includeScheduleForm = false,
			includeTimeslotsSchedule = false,
			includeLabels = false,
			includeLabelCategories = false,
		} = {},
		skipAuthorisation?: boolean,
	): Promise<Service> {
		const validator = this.getValidator();
		const service = await this.servicesRepository.getService({
			id,
			includeScheduleForm,
			includeTimeslotsSchedule,
			includeLabels,
			includeLabelCategories,
			skipAuthorisation,
		});
		await validator.validateServiceFound(service);

		return service;
	}

	public async getServiceTimeslotsSchedule(id: number): Promise<TimeslotsSchedule> {
		const service = await this.getService(id, { includeTimeslotsSchedule: true });
		return service.timeslotsSchedule;
	}

	public async addTimeslotItem(serviceId: number, request: TimeslotItemRequest): Promise<TimeslotItem> {
		const service = await this.getService(serviceId, { includeTimeslotsSchedule: true });
		if (!service.timeslotsSchedule) {
			await this.createTimeslotsSchedule(service);
		}
		return this.timeslotItemsService.createTimeslotItem(service.timeslotsSchedule, request);
	}

	public async deleteTimeslotsScheduleItem(timeslotId: number) {
		await this.timeslotItemsService.deleteTimeslot({ id: timeslotId });
	}

	public async updateTimeslotItem({
		serviceId,
		timeslotId,
		request,
	}: {
		serviceId: number;
		timeslotId: number;
		request: TimeslotItemRequest;
	}): Promise<TimeslotItem> {
		const timeslotsSchedule = await this.getServiceTimeslotsSchedule(serviceId);
		return this.timeslotItemsService.updateTimeslotItem(timeslotsSchedule, timeslotId, request);
	}

	private async createTimeslotsSchedule(service: Service): Promise<TimeslotsSchedule> {
		service.timeslotsSchedule = TimeslotsSchedule.create(service, undefined);
		await this.servicesRepository.save(service);
		return service.timeslotsSchedule;
	}

	private async verifyActionPermission(service: Service, action: CrudAction): Promise<void> {
		const authGroups = await this.userContext.getAuthGroups();
		if (!new ServicesActionAuthVisitor(service, action).hasPermission(authGroups)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
				`User cannot perform this action (${action}) for services.`,
			);
		}
	}
}
