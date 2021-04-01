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
import { ServicesRepository } from './services.repository';
import { ServiceRequest } from './service.apicontract';
import { ScheduleFormsService } from '../scheduleForms/scheduleForms.service';
import { TimeslotItemRequest } from '../timeslotItems/timeslotItems.apicontract';
import { TimeslotItemsService } from '../timeslotItems/timeslotItems.service';
import { UserContext } from '../../infrastructure/auth/userContext';
import { ServicesActionAuthVisitor } from './services.auth';
import { CrudAction } from '../../enums/crudAction';
import { ScheduleFormRequest } from '../scheduleForms/scheduleForms.apicontract';
import { OrganisationsNoauthRepository } from '../organisations/organisations.noauth.repository';
import { MolUsersService } from '../users/molUsers/molUsers.service';
import {
	isMolUserMatch,
	MolServiceAdminUserContract,
	MolUpsertUsersResult,
} from '../users/molUsers/molUsers.apicontract';
import { MolUsersMapper } from '../users/molUsers/molUsers.mapper';
import { uniqueStringArray } from '../../tools/collections';
import { LabelsMapper } from '../labels/labels.mapper';

@InRequestScope
export class ServicesService {
	@Inject
	private servicesRepository: ServicesRepository;
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
			service.serviceAdminGroupMap = service.serviceAdminGroupMap || new ServiceAdminGroupMap();
			service.serviceAdminGroupMap.serviceOrganisationRef = ServiceAdminGroupMap.createServiceOrganisationRef(
				service.getServiceRef(),
				organisation._organisationAdminGroupMap.organisationRef,
			);
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
		const molAdminUser = MolUsersMapper.mapServicesAdminsGroups(adminUserContracts, orga);
		const res: MolUpsertUsersResult = await this.molUsersService.molUpsertUser(molAdminUser, {
			token: authorisationToken,
			desiredDeliveryMediumsHeader,
		});

		if (res?.error) return res;
		const upsertedMolUser = [...(res?.created || []), ...(res?.updated || [])];
		if (upsertedMolUser) {
			const upsertedAdminUsers = adminUserContracts.filter((adminUser) =>
				upsertedMolUser.some((molUser) => isMolUserMatch(molUser, adminUser)),
			);

			const serviceNames = [].concat(...upsertedAdminUsers.map((a) => a.serviceNames));
			await this.createServices(serviceNames, orga);
		}
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

		const transformedLabels = this.labelsMapper.mapToLabels(request.labels);

		const service = Service.create(request.name, orga, transformedLabels);
		service.labels = transformedLabels;

		await this.verifyActionPermission(service, CrudAction.Create);
		return this.servicesRepository.save(service);
	}

	public async updateService(id: number, request: ServiceRequest): Promise<Service> {
		try {
			const service = await this.servicesRepository.getService({ id });
			if (!service) throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
			service.name = request.name;
			service.labels = this.labelsMapper.mapToLabels(request.labels);
			await this.verifyActionPermission(service, CrudAction.Update);
			return await this.servicesRepository.save(service);
		} catch (e) {
			if (e.message.startsWith('duplicate key value violates unique constraint')){
				if (e.message.includes('IDX_44b3185ec745b6f7cb4a114396')) {
					throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Label(s) are already present');
				}
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Service name is already present');
			}
			throw e;
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
