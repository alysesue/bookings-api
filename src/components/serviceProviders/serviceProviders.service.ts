import { isEmail, isSGPhoneNumber } from 'mol-lib-api-contract/utils';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { Inject, InRequestScope } from 'typescript-ioc';
import { cloneDeep } from 'lodash';
import { ScheduleForm, ServiceProvider, TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../../models';
import { ServiceProvidersRepository } from './serviceProviders.repository';
import {
	MolServiceProviderOnboard,
	MolServiceProviderOnboardContract,
	ServiceProviderModel,
} from './serviceProviders.apicontract';
import { ScheduleFormsService } from '../scheduleForms/scheduleForms.service';
import { TimeslotItemRequest } from '../timeslotItems/timeslotItems.apicontract';
import { ServicesService } from '../services/services.service';
import { TimeslotItemsService } from '../timeslotItems/timeslotItems.service';
import { TimeslotsService } from '../timeslots/timeslots.service';
import { ServiceProvidersActionAuthVisitor } from './serviceProviders.auth';
import { UserContext } from '../../infrastructure/auth/userContext';
import { CrudAction } from '../../enums/crudAction';
import { ScheduleFormRequest } from '../scheduleForms/scheduleForms.apicontract';
import { ServiceProvidersMapper } from './serviceProviders.mapper';
import { MolUpsertUsersResult } from '../users/molUsers/molUsers.apicontract';
import { MolUsersService } from '../users/molUsers/molUsers.service';
import { UsersService } from '../users/users.service';
import { MolUsersMapper } from '../users/molUsers/molUsers.mapper';

@InRequestScope
export class ServiceProvidersService {
	@Inject
	public serviceProvidersRepository: ServiceProvidersRepository;

	@Inject
	private schedulesService: ScheduleFormsService;

	@Inject
	private timeslotItemsService: TimeslotItemsService;

	@Inject
	private servicesService: ServicesService;

	@Inject
	private mapper: ServiceProvidersMapper;

	@Inject
	private timeslotsService: TimeslotsService;

	@Inject
	private scheduleFormsService: ScheduleFormsService;

	@Inject
	private userContext: UserContext;

	@Inject
	private usersService: UsersService;

	@Inject
	private molUsersService: MolUsersService;

	/**
	 * @deprecated please use createServiceProviders
	 */
	private static async validateServiceProvider(sp: ServiceProviderModel): Promise<string[]> {
		const errors: string[] = [];
		if (sp.phone && !(await isSGPhoneNumber(sp.phone)).pass)
			errors.push(`For service provider: ${sp.name}. Phone number is invalid: ${sp.phone}.`);
		if (sp.email && !(await isEmail(sp.email)).pass)
			errors.push(`For service provider: ${sp.name}. Email is invalid: ${sp.email}.`);
		return errors;
	}

	/**
	 * @deprecated please use createServiceProviders
	 */
	private static async validateServiceProviders(sps: ServiceProviderModel[]) {
		const errorsPromises = sps.map((e) => ServiceProvidersService.validateServiceProvider(e));
		await Promise.all(errorsPromises).then((errors) => {
			const errorsFlat = [].concat(...errors);
			if (errorsFlat?.length) {
				const molError = new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
					`Bulk of service providers incorrect`,
				);
				const data = {
					errors: errorsFlat,
					rules: {
						header: 'First line should be: name, email, phone',
						email: 'Email should contain @ and .',
						phone: 'Phone number should be a Singapore phone number',
					},
				};
				molError.setResponseData(data);
				throw molError;
			}
		});
	}

	public async getServiceProviders(
		serviceId?: number,
		includeScheduleForm = false,
		includeTimeslotsSchedule = false,
	): Promise<ServiceProvider[]> {
		return await this.serviceProvidersRepository.getServiceProviders({
			serviceId,
			includeScheduleForm,
			includeTimeslotsSchedule,
		});
	}

	public async getAvailableServiceProviders(from: Date, to: Date, serviceId?: number): Promise<ServiceProvider[]> {
		const timeslots = await this.timeslotsService.getAggregatedTimeslots(from, to, serviceId, false);

		const availableServiceProviders = new Set<ServiceProvider>();

		timeslots.forEach((timeslot) => {
			for (const spTimeslotItem of timeslot.getTimeslotServiceProviders()) {
				if (spTimeslotItem.availabilityCount > 0) {
					availableServiceProviders.add(spTimeslotItem.serviceProvider);
				}
			}
		});
		return Array.from(availableServiceProviders);
	}

	public async getServiceProvider(
		id: number,
		includeScheduleForm = false,
		includeTimeslotsSchedule = false,
	): Promise<ServiceProvider> {
		const sp = await this.serviceProvidersRepository.getServiceProvider({
			id,
			includeScheduleForm,
			includeTimeslotsSchedule,
		});
		if (!sp) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Service provider with id ${id} not found`);
		}
		return sp;
	}

	private async mapAndValidateServiceProvidersOnboard(serviceProvidersOnboards: MolServiceProviderOnboard[]) {
		const orga = await this.userContext.verifyAndGetFirstAuthorisedOrganisation();
		const services = await this.servicesService.getServices();
		const servicesName = serviceProvidersOnboards.map((sp) => sp.serviceName);
		const newServicesNameMap = new Map(servicesName.map((s) => [s.toLowerCase(), s]));
		const newServicesName = [...newServicesNameMap.values()].filter(
			(srv) => !services.some((s) => s.name === srv.trim()),
		);

		const newServices = await Promise.all(
			newServicesName.map(
				async (name) => await this.servicesService.createService({ name, organisationId: orga.id }),
			),
		);
		const allServices = [...services, ...newServices];
		const serviceProviders = serviceProvidersOnboards.map((sp) => {
			const matchSrv = allServices.find((srv) => srv.name.toLowerCase() === sp.serviceName.toLowerCase());
			return this.mapper.mapToEntity(sp, matchSrv);
		});

		await ServiceProvider.validateEntities(serviceProviders);

		return serviceProviders;
	}

	public async createServiceProviders(
		serviceProviderOnboardContracts: MolServiceProviderOnboardContract[],
	): Promise<MolUpsertUsersResult> {
		const orga = await this.userContext.verifyAndGetFirstAuthorisedOrganisation(
			'Cannot add service provider with this organisation',
		);
		const molServiceProviderOnboards = MolUsersMapper.mapServiceProviderGroup(
			serviceProviderOnboardContracts,
			orga,
		);

		const res: MolUpsertUsersResult = await this.molUsersService.molUpsertUser(molServiceProviderOnboards);

		const upsertedMolUser = [...(res?.created || []), ...(res?.updated || [])];

		if (upsertedMolUser) {
			await this.usersService.upsertAdminUsers(upsertedMolUser);
			const upsertedAdminUsers: MolServiceProviderOnboard[] = [];
			molServiceProviderOnboards.forEach((adminUser) => {
				const matchMolUser = upsertedMolUser.find((molUser) => molUser.uinfin === adminUser.uinfin);
				if (matchMolUser) {
					upsertedAdminUsers.push({ ...adminUser, molAdminId: matchMolUser.sub });
				}
			});
			const sps = await this.mapAndValidateServiceProvidersOnboard(molServiceProviderOnboards);
			await Promise.all(sps.map(async (sp) => await this.verifyActionPermission(sp, CrudAction.Create)));
			await Promise.all(sps.map(async (sp) => await this.serviceProvidersRepository.save(sp)));
		}
		return res;
	}

	/**
	 * @deprecated please use createServiceProviders
	 */
	public async saveServiceProviders(listRequest: ServiceProviderModel[], serviceId: number) {
		await ServiceProvidersService.validateServiceProviders(listRequest);
		// tslint:disable-next-line:prefer-for-of
		for (let i = 0; i < listRequest.length; i++) {
			await this.saveServiceProvider(listRequest[i], serviceId);
		}
	}

	/**
	 * @deprecated please use createServiceProviders
	 */
	public async saveServiceProvider(item: ServiceProviderModel, serviceId: number) {
		const serviceProvider = ServiceProvider.create(item.name, serviceId, item.email, item.phone);
		serviceProvider.service = await this.servicesService.getService(serviceId);
		await this.verifyActionPermission(serviceProvider, CrudAction.Create);

		return await this.serviceProvidersRepository.save(serviceProvider);
	}

	public async updateSp(request: ServiceProviderModel, spId: number) {
		const serviceProvider = await this.serviceProvidersRepository.getServiceProvider({ id: spId });
		if (!serviceProvider) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service provider not found');
		}
		await this.verifyActionPermission(serviceProvider, CrudAction.Update);
		await ServiceProvidersService.validateServiceProviders([request]);
		serviceProvider.email = request.email;
		serviceProvider.phone = request.phone;
		serviceProvider.name = request.name;
		return await this.serviceProvidersRepository.save(serviceProvider);
	}

	public async setProvidersScheduleForm(orgaId: number, request: ScheduleFormRequest): Promise<ServiceProvider[]> {
		const serviceProviders = await this.serviceProvidersRepository.getServiceProviders({ organisationId: orgaId });
		const serviceProvidersRes = [];
		for await (const serviceProvider of this.putProviderScheduleForm(serviceProviders, request)) {
			serviceProvidersRes.push(serviceProvider);
		}
		return serviceProvidersRes;
	}

	private async *putProviderScheduleForm(
		sps: ServiceProvider[],
		request: ScheduleFormRequest,
	): AsyncIterable<ServiceProvider> {
		const saveSpFunction = async (sp: ServiceProvider) => {
			sp.scheduleFormConfirmed = false;
			return await this.serviceProvidersRepository.save(sp);
		};
		for (const sp of sps) {
			yield await this.scheduleFormsService.updateScheduleFormInEntity(request, sp, saveSpFunction);
		}
	}

	public async setProviderScheduleForm(id: number, model: ScheduleFormRequest): Promise<ScheduleForm> {
		const serviceProvider = await this.getServiceProvider(id, true, true);
		await this.verifyActionPermission(serviceProvider, CrudAction.Update);

		const saveSpFunction = async (sp: ServiceProvider) => {
			sp.scheduleFormConfirmed = true;
			return await this.serviceProvidersRepository.save(sp);
		};

		await this.schedulesService.updateScheduleFormInEntity(model, serviceProvider, saveSpFunction);

		return serviceProvider.scheduleForm;
	}

	public async getProviderScheduleForm(id: number): Promise<ScheduleForm> {
		const serviceProvider = await this.getServiceProvider(id, true, false);
		if (!serviceProvider) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service Provider not found');
		}

		if (!serviceProvider.scheduleForm) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service schedule form not found');
		}

		return serviceProvider.scheduleForm;
	}

	public async getTimeslotItems(id: number): Promise<TimeslotsSchedule> {
		const serviceProvider = await this.getServiceProvider(id, false, true);
		if (!serviceProvider.timeslotsSchedule) {
			return await this.servicesService.getServiceTimeslotsSchedule(serviceProvider.serviceId);
		}
		return serviceProvider.timeslotsSchedule;
	}

	public async addTimeslotItem(serviceProviderId: number, request: TimeslotItemRequest): Promise<TimeslotItem> {
		let serviceProvider = await this.getServiceProvider(serviceProviderId, false, true);
		if (!serviceProvider.timeslotsSchedule) {
			const serviceTimeslotsSchedule = await this.servicesService.getServiceTimeslotsSchedule(
				serviceProvider.serviceId,
			);
			serviceProvider = await this.copyAndSaveTimeslotsScheduleInServiceProvider(
				serviceProvider,
				serviceTimeslotsSchedule?.timeslotItems || [],
			);
		}
		return this.timeslotItemsService.createTimeslotItem(serviceProvider.timeslotsSchedule, request);
	}

	public async updateTimeslotItem(
		serviceProviderId: number,
		timeslotId: number,
		request: TimeslotItemRequest,
	): Promise<TimeslotItem> {
		const serviceProvider = await this.getServiceProvider(serviceProviderId, false, true);
		if (!serviceProvider.timeslotsSchedule) {
			const newItem = TimeslotItem.create(
				undefined,
				request.weekDay,
				TimeOfDay.parse(request.startTime),
				TimeOfDay.parse(request.endTime),
			);
			const serviceTimeslotsSchedule = await this.servicesService.getServiceTimeslotsSchedule(
				serviceProvider.serviceId,
			);
			const timeslotItemServiceWithoutTargetItem = (serviceTimeslotsSchedule?.timeslotItems || []).filter(
				(t) => t._id !== timeslotId,
			);
			timeslotItemServiceWithoutTargetItem.push(newItem);

			await this.copyAndSaveTimeslotsScheduleInServiceProvider(
				serviceProvider,
				timeslotItemServiceWithoutTargetItem,
			);
			return newItem;
		}
		const timeslotItem = serviceProvider.timeslotsSchedule.timeslotItems.find((t) => t._id === timeslotId);
		if (!timeslotItem) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Timeslot item not found');
		}
		return this.timeslotItemsService.mapAndSaveTimeslotItem(
			serviceProvider.timeslotsSchedule,
			request,
			timeslotItem,
		);
	}

	public async deleteTimeslotItem(serviceProviderId: number, timeslotId: number) {
		const serviceProvider = await this.getServiceProvider(serviceProviderId, false, true);
		if (!serviceProvider.timeslotsSchedule) {
			const serviceTimeslotsSchedule = await this.servicesService.getServiceTimeslotsSchedule(
				serviceProvider.serviceId,
			);
			const timeslotItemServiceWithoutTargetItem = (serviceTimeslotsSchedule?.timeslotItems || []).filter(
				(t) => t._id !== timeslotId,
			);

			await this.copyAndSaveTimeslotsScheduleInServiceProvider(
				serviceProvider,
				timeslotItemServiceWithoutTargetItem,
			);
			return;
		}
		const timeslotItem = serviceProvider.timeslotsSchedule.timeslotItems.find((t) => t._id === timeslotId);
		if (!timeslotItem) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Timeslot item not found');
		}

		await this.timeslotItemsService.deleteTimeslot({ id: timeslotId });
	}

	private async copyAndSaveTimeslotsScheduleInServiceProvider(
		serviceProvider: ServiceProvider,
		timeslotItems: TimeslotItem[],
	): Promise<ServiceProvider> {
		serviceProvider.timeslotsSchedule = TimeslotsSchedule.create(undefined, serviceProvider);

		const items = cloneDeep(timeslotItems);
		items.forEach((i) => {
			i._id = undefined;
			i._timeslotsScheduleId = undefined;
			i._timeslotsSchedule = serviceProvider.timeslotsSchedule;
		});
		serviceProvider.timeslotsSchedule.timeslotItems = items;

		return await this.serviceProvidersRepository.save(serviceProvider);
	}

	private async verifyActionPermission(serviceProvider: ServiceProvider, action: CrudAction): Promise<void> {
		const authGroups = await this.userContext.getAuthGroups();
		if (!new ServiceProvidersActionAuthVisitor(serviceProvider, action).hasPermission(authGroups)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
				`User cannot perform this service-provider action (${action}) for this service. Service provider: ${serviceProvider.name}`,
			);
		}
	}
}
