import { isDateTime, isEmail, isSGPhoneNumber } from 'mol-lib-api-contract/utils';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { Inject, InRequestScope } from 'typescript-ioc';
import { cloneDeep } from 'lodash';
import { Organisation, ScheduleForm, ServiceProvider, TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../../models';
import { ScheduleFormsService } from '../scheduleForms/scheduleForms.service';
import { TimeslotItemRequest } from '../timeslotItems/timeslotItems.apicontract';
import { ServicesService } from '../services/services.service';
import { TimeslotItemsService } from '../timeslotItems/timeslotItems.service';
import { TimeslotsService } from '../timeslots/timeslots.service';
import { UserContext } from '../../infrastructure/auth/userContext';
import { CrudAction } from '../../enums/crudAction';
import { ScheduleFormRequest } from '../scheduleForms/scheduleForms.apicontract';
import { isMolUserMatch, MolUpsertUsersResult } from '../users/molUsers/molUsers.apicontract';
import { MolUsersService } from '../users/molUsers/molUsers.service';
import { MolUsersMapper } from '../users/molUsers/molUsers.mapper';
import { ServiceProvidersMapper } from './serviceProviders.mapper';
import { ServiceProviderAction, ServiceProvidersActionAuthVisitor, SpAction } from './serviceProviders.auth';
import {
	MolServiceProviderOnboard,
	MolServiceProviderOnboardContract,
	ServiceProviderModel,
} from './serviceProviders.apicontract';
import { ServiceProvidersRepository } from './serviceProviders.repository';
import { DateHelper } from '../../infrastructure/dateHelper';
import { IPagedEntities } from '../../core/pagedEntities';

const DEFAULT_PHONE_NUMBER = '+6580000000';

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
	private molUsersService: MolUsersService;

	private static async validateServiceProvider(sp: ServiceProviderModel): Promise<string[]> {
		const errors: string[] = [];
		if (sp.phone && !(await isSGPhoneNumber(sp.phone)).pass)
			errors.push(`For service provider: ${sp.name}. Phone number is invalid: ${sp.phone}.`);
		if (sp.email && !(await isEmail(sp.email)).pass)
			errors.push(`For service provider: ${sp.name}. Email is invalid: ${sp.email}.`);
		if (sp.expiryDate && !(await isDateTime(sp.expiryDate)).pass)
			errors.push(`For service provider: ${sp.name}. Expiry date is invalid: ${sp.expiryDate}`);
		return errors;
	}

	private static async validateServiceProviders(sps: ServiceProviderModel[]) {
		const errorsPromises = sps.map((e) => ServiceProvidersService.validateServiceProvider(e));
		await Promise.all(errorsPromises).then((errors) => {
			const errorsFlat = [].concat(...errors);
			if (errorsFlat?.length) {
				const molError = new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
					`Service providers are incorrect`,
				);
				const data = {
					errors: errorsFlat,
					rules: {
						header: 'First line should be: name, email, phone',
						email: 'Email should contain @ and .',
						phone: 'Phone number should be a Singapore phone number',
						expiryDate: 'Expiry Date, should be in format YYYY-MM-DDThh:mm:ss:000Z',
					},
				};
				molError.setResponseData(data);
				throw molError;
			}
		});
	}

	public async getServiceProviders(options: {
		serviceId?: number;
		includeScheduleForm?: boolean;
		includeTimeslotsSchedule?: boolean;
		limit?: number;
		pageNumber?: number;
		ids?: number[];
	}): Promise<ServiceProvider[]> {
		const {
			serviceId,
			includeTimeslotsSchedule = false,
			includeScheduleForm = false,
			limit,
			pageNumber,
			ids = [],
		} = options;
		return await this.serviceProvidersRepository.getServiceProviders({
			ids,
			serviceId,
			includeScheduleForm,
			includeTimeslotsSchedule,
			limit,
			pageNumber,
		});
	}

	public async getServiceProvidersCount(
		serviceId?: number,
		includeScheduleForm = false,
		includeTimeslotsSchedule = false,
	): Promise<number> {
		return await this.serviceProvidersRepository.getServiceProvidersCount({
			serviceId,
			includeScheduleForm,
			includeTimeslotsSchedule,
		});
	}

	public async getAvailableServiceProvidersCount(serviceId?: number, from?: Date, to?: Date): Promise<number> {
		const timeslots = await this.timeslotsService.getAggregatedTimeslots({
			startDateTime: from,
			endDateTime: to,
			serviceId,
			includeBookings: false,
			filterDaysInAdvance: false,
		});
		const availableServiceProviders = new Set<ServiceProvider>();

		timeslots.forEach((timeslot) => {
			for (const spTimeslotItem of timeslot.getTimeslotServiceProviders()) {
				if (spTimeslotItem.availabilityCount > 0) {
					availableServiceProviders.add(spTimeslotItem.serviceProvider);
				}
			}
		});
		return Array.from(availableServiceProviders).length;
	}

	public async getPagedServiceProviders(
		from: Date,
		to: Date,
		filterDaysInAdvance: boolean,
		includeTimeslotsSchedule = false,
		includeScheduleForm = false,
		limit?: number,
		page?: number,
		serviceId?: number,
	): Promise<IPagedEntities<ServiceProvider>> {
		let result: ServiceProvider[] = [];
		if (from && to) {
			if (serviceId) {
				result = await this.getAvailableServiceProviders(from, to, filterDaysInAdvance, serviceId);
			} else {
				const servicesList = await this.servicesService.getServices();
				for (const service of servicesList) {
					result.push(
						...(await this.getAvailableServiceProviders(from, to, filterDaysInAdvance, service.id)),
					);
				}
			}
		} else {
			result = await this.getServiceProviders({ serviceId, includeScheduleForm, includeTimeslotsSchedule });
		}
		const resultLength = result.length;
		result.sort((a, b) => {
			return a.id - b.id;
		});
		const culledResult = result.splice((page - 1) * limit, limit);
		const maxPage = Math.ceil(result.length / limit);

		const response: IPagedEntities<ServiceProvider> = {
			entries: culledResult,
			page,
			limit,
			total: resultLength,
			maxId: undefined,
			outdatedMaxId: undefined,
			hasMore: maxPage > page,
		};
		return response;
	}

	public async getAvailableServiceProviders(
		from: Date,
		to: Date,
		filterDaysInAdvance: boolean,
		serviceId?: number,
	): Promise<ServiceProvider[]> {
		const timeslots = await this.timeslotsService.getAggregatedTimeslots({
			startDateTime: from,
			endDateTime: to,
			serviceId,
			includeBookings: false,
			filterDaysInAdvance,
		});

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

	public async getServiceProvidersByName(searchKey: string, serviceId?: number): Promise<ServiceProvider[]> {
		const spList = await this.serviceProvidersRepository.getServiceProvidersByName({
			searchKey,
			serviceId,
		});
		if (!spList) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(
				`Service provider with name that contains ${searchKey} not found`,
			);
		}
		return spList;
	}

	private async mapAndValidateServiceProvidersOnboard(
		serviceProvidersOnboards: MolServiceProviderOnboard[],
		organisation: Organisation,
	) {
		const serviceNames = serviceProvidersOnboards.map((sp) => sp.serviceName);
		const allServices = await this.servicesService.createServices(serviceNames, organisation);

		const existingServiceProviders = await this.serviceProvidersRepository.getServiceProviders({
			organisationId: organisation.id,
			skipAuthorisation: true,
		});

		const serviceProviders = serviceProvidersOnboards.map((onboardingSp) => {
			const service = allServices.find(
				(svc) => svc.name.toLowerCase() === onboardingSp.serviceName.toLowerCase(),
			);
			let serviceProvider = existingServiceProviders.find(
				(sp) => sp.serviceProviderGroupMap?.molAdminId?.toLowerCase() === onboardingSp.molAdminId.toLowerCase(),
			);
			if (!serviceProvider) {
				serviceProvider = existingServiceProviders.find(
					(sp) =>
						!!onboardingSp.agencyUserId &&
						sp.agencyUserId?.toLowerCase() === onboardingSp.agencyUserId.toLowerCase(),
				);
			}

			return this.mapper.mapToEntity(onboardingSp, service, serviceProvider);
		});

		return serviceProviders;
	}

	public async createServiceProviders(
		serviceProviderOnboardContracts: MolServiceProviderOnboardContract[],
		cookie: string,
		desiredDeliveryMediumsHeader?: string,
	): Promise<MolUpsertUsersResult> {
		const organisation = await this.userContext.verifyAndGetFirstAuthorisedOrganisation(
			'Cannot add service provider with this organisation',
		);
		const molServiceProviderOnboards = MolUsersMapper.mapServiceProviderGroup(
			serviceProviderOnboardContracts,
			organisation,
		);

		const res: MolUpsertUsersResult = await this.molUsersService.molUpsertUser(
			molServiceProviderOnboards.map((sp) => ({ ...sp, phoneNumber: sp.phoneNumber || DEFAULT_PHONE_NUMBER })),
			{
				token: cookie,
				desiredDeliveryMediumsHeader,
			},
		);

		const upsertedMolUser = [...(res?.created || []), ...(res?.updated || [])];

		if (upsertedMolUser.length > 0) {
			const upsertedAdminUsers: MolServiceProviderOnboard[] = [];
			molServiceProviderOnboards.forEach((adminUser) => {
				const matchMolUser = upsertedMolUser.find((molUser) => isMolUserMatch(molUser, adminUser));
				if (matchMolUser) {
					upsertedAdminUsers.push({
						...adminUser,
						molAdminId: matchMolUser.sub,
						username: matchMolUser.username,
					});
				}
			});

			const sps = await this.mapAndValidateServiceProvidersOnboard(upsertedAdminUsers, organisation);
			await this.serviceProvidersRepository.saveMany(sps);
		}
		return res;
	}

	public async saveServiceProviders(listRequest: ServiceProviderModel[], serviceId: number) {
		await ServiceProvidersService.validateServiceProviders(listRequest);
		// tslint:disable-next-line:prefer-for-of
		for (let i = 0; i < listRequest.length; i++) {
			await this.saveServiceProvider(listRequest[i], serviceId);
		}
	}

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
		if (request.expiryDate) await this.verifyActionPermission(serviceProvider, SpAction.UpdateExpiryDate);

		await ServiceProvidersService.validateServiceProviders([request]);
		const updatedServiceProvider = this.mapper.mapServiceProviderModelToEntity(request, serviceProvider);
		return await this.serviceProvidersRepository.save(updatedServiceProvider);
	}

	public async setProvidersScheduleForm(orgaId: number, request: ScheduleFormRequest): Promise<ServiceProvider[]> {
		this.verifyScheduleDates(request);
		if (request.startDate && request.endDate) {
			request.startDate = DateHelper.getDateOnly(request.startDate);
			request.endDate = DateHelper.getDateOnly(request.endDate);
		}
		const serviceProviders = await this.serviceProvidersRepository.getServiceProviders({ organisationId: orgaId });
		const serviceProvidersRes = [];

		const filteredServiceProviders = this.getFilteredServiceProvidersByEmail(request, serviceProviders);

		for await (const serviceProvider of this.putProviderScheduleForm(filteredServiceProviders, request)) {
			serviceProvidersRes.push(serviceProvider);
		}

		return serviceProvidersRes;
	}

	private verifyScheduleDates(request: ScheduleFormRequest) {
		if (request.endDate < request.startDate) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				'End date cannot be earlier than start date',
			);
		}
		if ((request.startDate || request.endDate) && (!request.startDate || !request.endDate)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				'Both the start date and end date must be selected or empty',
			);
		}
	}

	public getFilteredServiceProvidersByEmail(
		request: ScheduleFormRequest,
		serviceProviders: ServiceProvider[],
	): ServiceProvider[] {
		const filteredServiceProviders: ServiceProvider[] = [];
		if (!request.serviceProvidersEmailList.length) {
			filteredServiceProviders.push(...serviceProviders);
		} else {
			return serviceProviders.filter((sp) =>
				request.serviceProvidersEmailList.some((spEmail) => sp.email === spEmail),
			);
		}
		return filteredServiceProviders;
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
				request.startDate,
				request.endDate,
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

	private async verifyActionPermission(
		serviceProvider: ServiceProvider,
		action: ServiceProviderAction,
	): Promise<void> {
		const authGroups = await this.userContext.getAuthGroups();
		if (!new ServiceProvidersActionAuthVisitor(serviceProvider, action).hasPermission(authGroups)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
				`User cannot perform this service-provider action (${action}) for this service. Service provider: ${serviceProvider.name}`,
			);
		}
	}
}
