import { Inject, InRequestScope } from 'typescript-ioc';
import { Service, ServiceProvider, ServiceProviderGroupMap, ServiceProviderLabel } from '../../models';
import {
	MolServiceProviderOnboard,
	ServiceProviderModel,
	ServiceProviderResponseModelBase,
	ServiceProviderResponseModelV1,
	ServiceProviderResponseModelV2,
	ServiceProviderSummaryModelV1,
	ServiceProviderSummaryModelV2,
} from './serviceProviders.apicontract';
import { UserContext } from '../../infrastructure/auth/userContext';
import { IdHasher } from '../../infrastructure/idHasher';
import { TimeslotItemsMapper } from '../timeslotItems/timeslotItems.mapper';
import { ScheduleFormsMapper } from '../scheduleForms/scheduleForms.mapper';
import { SPLabelsCategoriesMapper } from '../serviceProvidersLabels/serviceProvidersLabels.mapper';

@InRequestScope
export class ServiceProvidersMapper {
	@Inject
	private userContext: UserContext;
	@Inject
	private idHasher: IdHasher;
	@Inject
	private timeslotItemsMapper: TimeslotItemsMapper;
	@Inject
	private scheduleFormsMapper: ScheduleFormsMapper;
	@Inject
	private spLabelsCategoriesMapper: SPLabelsCategoriesMapper;

	private async mapDataModelBase(spData: ServiceProvider): Promise<ServiceProviderResponseModelBase> {
		const currentUser = await this.userContext.getCurrentUser();
		const userIsAdmin = currentUser.isAdmin() || currentUser.isAgency();

		const response = new ServiceProviderResponseModelBase();
		response.name = spData.name;
		response.scheduleFormConfirmed = spData.scheduleFormConfirmed;
		response.description = spData?.description;
		response.onHoldEnabled = spData.service?.isOnHold;
		response.aliasName = spData.aliasName;

		if (userIsAdmin) {
			response.email = spData.email;
			response.phone = spData.phone;
			response.expiryDate = spData.expiryDate;
			response.agencyUserId = spData.agencyUserId;
			response.autoAcceptBookings = spData.autoAcceptBookings;
		}

		return response;
	}

	public async mapDataModelV1(
		spData: ServiceProvider,
		options: { includeTimeslotsSchedule?: boolean; includeScheduleForm?: boolean },
	): Promise<ServiceProviderResponseModelV1> {
		const serviceProviderResponse = await this.mapDataModelBase(spData);
		let timeslotsSchedule;
		if (options.includeTimeslotsSchedule) {
			timeslotsSchedule = this.timeslotItemsMapper.mapToTimeslotsScheduleResponseV1(spData.timeslotsSchedule);
		}
		let scheduleForm;
		if (options.includeScheduleForm) {
			scheduleForm = this.scheduleFormsMapper.mapToResponseV1(spData.scheduleForm);
		}
		const serviceProviderId = spData.id;
		const serviceId = spData.serviceId;
		return { ...serviceProviderResponse, id: serviceProviderId, serviceId, timeslotsSchedule, scheduleForm };
	}

	public async mapDataModelV2(
		spData: ServiceProvider,
		options: { includeTimeslotsSchedule?: boolean; includeScheduleForm?: boolean; includeLabels?: boolean },
	): Promise<ServiceProviderResponseModelV2> {
		const serviceProviderResponse = await this.mapDataModelBase(spData);
		let timeslotsSchedule;
		if (options.includeTimeslotsSchedule) {
			timeslotsSchedule = this.timeslotItemsMapper.mapToTimeslotsScheduleResponseV2(spData.timeslotsSchedule);
		}
		let scheduleForm;
		if (options.includeScheduleForm) {
			scheduleForm = this.scheduleFormsMapper.mapToResponseV2(spData.scheduleForm);
		}
		const serviceProviderId = this.idHasher.encode(spData.id);
		const serviceId = this.idHasher.encode(spData.serviceId);
		let labels;
		if (options.includeLabels) {
			labels = this.spLabelsCategoriesMapper.mapToServiceProviderLabelsResponse(spData.labels);
		}

		return {
			...serviceProviderResponse,
			id: serviceProviderId,
			serviceId,
			timeslotsSchedule,
			scheduleForm,
			labels,
		};
	}

	public async mapDataModelsV1(
		spList: ServiceProvider[],
		options: { includeTimeslotsSchedule?: boolean; includeScheduleForm?: boolean },
	): Promise<ServiceProviderResponseModelV1[]> {
		const result = [];

		for (const sp of spList) {
			result.push(await this.mapDataModelV1(sp, options));
		}
		return result;
	}

	public async mapDataModelsV2(
		spList: ServiceProvider[],
		options: { includeTimeslotsSchedule?: boolean; includeScheduleForm?: boolean; includeLabels?: boolean },
	): Promise<ServiceProviderResponseModelV2[]> {
		const result = [];

		for (const sp of spList) {
			result.push(await this.mapDataModelV2(sp, options));
		}
		return result;
	}

	private mapSummaryDataModelV1(entry: ServiceProvider): ServiceProviderSummaryModelV1 {
		return new ServiceProviderSummaryModelV1(entry.id, entry.name);
	}

	public mapSummaryDataModelsV1(entries: ServiceProvider[]): ServiceProviderSummaryModelV1[] {
		return entries?.map((e) => this.mapSummaryDataModelV1(e));
	}

	private mapSummaryDataModelV2(entry: ServiceProvider): ServiceProviderSummaryModelV2 {
		const signedServiceProviderId = this.idHasher.encode(entry.id);
		return new ServiceProviderSummaryModelV2(signedServiceProviderId, entry.name);
	}

	public mapSummaryDataModelsV2(entries: ServiceProvider[]): ServiceProviderSummaryModelV2[] {
		return entries?.map((e) => this.mapSummaryDataModelV2(e));
	}

	public mapToEntity(
		onboardingSp: MolServiceProviderOnboard,
		service: Service,
		entity: ServiceProvider | undefined,
	): ServiceProvider {
		if (!service) {
			throw new Error('Service is required to create service provider');
		}

		let serviceProvider: ServiceProvider;
		if (entity) {
			serviceProvider = entity;
			serviceProvider.name = onboardingSp.name;
			serviceProvider.serviceId = service.id;
		} else {
			serviceProvider = ServiceProvider.create(onboardingSp.name, service.id);
		}

		serviceProvider.email = onboardingSp.email;
		serviceProvider.phone = onboardingSp.phoneNumber;
		serviceProvider.agencyUserId = onboardingSp.agencyUserId;
		serviceProvider.autoAcceptBookings = onboardingSp.autoAcceptBookings;

		serviceProvider.service = service;
		serviceProvider.serviceId = service.id;

		serviceProvider.serviceProviderGroupMap =
			serviceProvider.serviceProviderGroupMap || new ServiceProviderGroupMap();
		serviceProvider.serviceProviderGroupMap.molAdminId = onboardingSp.molAdminId;

		return serviceProvider;
	}

	public mapServiceProviderModelToEntity(
		sp: ServiceProviderModel,
		entity: ServiceProvider,
		spLabels?: ServiceProviderLabel[],
	): ServiceProvider {
		if (!entity) {
			throw new Error('Service provider not found');
		}
		const newSp: ServiceProvider = entity;
		newSp.email = sp.email;
		newSp.phone = sp.phone;
		newSp.name = sp.name;
		newSp.expiryDate = sp?.expiryDate ? new Date(sp.expiryDate) : null;
		newSp.description = sp?.description;
		newSp.aliasName = sp.aliasName;
		newSp.labels = spLabels;
		return newSp;
	}
}
