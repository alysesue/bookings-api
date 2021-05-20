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
import { ServicesActionAuthVisitor } from './services.auth';
import { ServiceRequest } from './service.apicontract';
import { ServicesRepository } from './services.repository';
import { LabelsCategoriesService } from "../labelsCategories/labelsCategories.service";

@InRequestScope
export class ServicesService {
	@Inject
	private servicesRepository: ServicesRepository;
	@Inject
	private categoriesService: LabelsCategoriesService
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
	private categoriesMapper: LabelsCategoriesMapper;

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

	public async createService(request: ServiceRequest): Promise<Service> {
		request.name = request.name?.trim();
		if (!request.name) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Service name is empty');
		}
		const orga = request.organisationId
			? await this.organisationsRepository.getOrganisationById(request.organisationId)
			: await this.userContext.verifyAndGetFirstAuthorisedOrganisation('User not authorized to add services.');

		const isSpAutoAssigned = request.isSpAutoAssigned;
		const transformedLabels = this.labelsMapper.mapToLabels(request.labels);
		const mapToCategories = this.categoriesMapper.mapToCategories(request.categories);
		const service = Service.create(request.name, orga, isSpAutoAssigned, transformedLabels, mapToCategories, request.emailSuffix);
		await this.verifyActionPermission(service, CrudAction.Create);
		return this.servicesRepository.save(service);
	}

	public async updateService(id: number, request: ServiceRequest): Promise<Service> {
		const service = await this.servicesRepository.getService({ id });
		if (!service) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
		}

		service.name = request.name;
		service.isSpAutoAssigned = request.isSpAutoAssigned || false;
		service.emailSuffix = request.emailSuffix;
		await this.verifyActionPermission(service, CrudAction.Update);

		const updatedLabelList = this.labelsMapper.mapToLabels(request.labels);
		this.labelsMapper.mergeLabels(service.labels, updatedLabelList);
		const updatedCategoriesList = this.categoriesMapper.mapToCategories(request.categories);

		try {
			service.categories = await this.categoriesService.update(service, updatedCategoriesList, updatedLabelList);
			return await this.servicesRepository.save(service);
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
		const service = await this.servicesRepository.getService({
			id,
			includeScheduleForm: true,
		});
		if (!service) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
		}

		if (!service.scheduleForm) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service scheduleForm not found');
		}

		return service.scheduleForm;
	}

	public async getServices(): Promise<Service[]> {
		return await this.servicesRepository.getAll();
	}

	public async getService(
		id: number,
		includeScheduleForm = false,
		includeTimeslotsSchedule = false,
	): Promise<Service> {
		const service = await this.servicesRepository.getService({ id, includeScheduleForm, includeTimeslotsSchedule });
		if (!service) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
		}
		return service;
	}

	public async getServiceTimeslotsSchedule(id: number): Promise<TimeslotsSchedule> {
		const service = await this.getService(id, false, true);
		return service.timeslotsSchedule;
	}

	public async addTimeslotItem(serviceId: number, request: TimeslotItemRequest): Promise<TimeslotItem> {
		const service = await this.getService(serviceId, false, true);
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
