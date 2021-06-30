import { Inject, InRequestScope } from 'typescript-ioc';
import { Service, ServiceProvider, ServiceProviderGroupMap } from '../../models';
import { mapToTimeslotsScheduleResponse } from '../timeslotItems/timeslotItems.mapper';
import { mapToResponse as mapScheduleFormResponse } from '../scheduleForms/scheduleForms.mapper';
import {
	MolServiceProviderOnboard,
	ServiceProviderModel,
	ServiceProviderResponseModel,
	ServiceProviderSummaryModel,
} from './serviceProviders.apicontract';
import { UserContext } from '../../infrastructure/auth/userContext';

@InRequestScope
export class ServiceProvidersMapper {
	@Inject
	private userContext: UserContext;

	public async mapDataModel(
		spData: ServiceProvider,
		options: { includeTimeslotsSchedule?: boolean; includeScheduleForm?: boolean },
	): Promise<ServiceProviderResponseModel> {
		const currentUser = await this.userContext.getCurrentUser();
		const userIsAdmin = currentUser.isAdmin() || currentUser.isAgency();

		const response = new ServiceProviderResponseModel();
		if (options.includeTimeslotsSchedule) {
			response.timeslotsSchedule = mapToTimeslotsScheduleResponse(spData.timeslotsSchedule);
		}
		if (options.includeScheduleForm) {
			response.scheduleForm = mapScheduleFormResponse(spData.scheduleForm);
		}

		response.id = spData.id;
		response.name = spData.name;
		response.serviceId = spData.serviceId;
		response.scheduleFormConfirmed = spData.scheduleFormConfirmed;
		response.description = spData?.description;
		response.onHoldEnabled = spData.service?.isOnHold;
		response.aliasName = spData.aliasName;

		if (userIsAdmin) {
			response.email = spData.email;
			response.phone = spData.phone;
			response.expiryDate = spData.expiryDate;
			response.agencyUserId = spData.agencyUserId;
		}

		return response;
	}

	public async mapDataModels(
		spList: ServiceProvider[],
		options: { includeTimeslotsSchedule?: boolean; includeScheduleForm?: boolean },
	): Promise<ServiceProviderResponseModel[]> {
		const result = [];

		for (const sp of spList) {
			result.push(await this.mapDataModel(sp, options));
		}
		return result;
	}

	public mapSummaryDataModel(entry: ServiceProvider): ServiceProviderSummaryModel {
		return new ServiceProviderSummaryModel(entry.id, entry.name);
	}

	public mapSummaryDataModels(entries: ServiceProvider[]): ServiceProviderSummaryModel[] {
		return entries?.map((e) => this.mapSummaryDataModel(e));
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

	public mapServiceProviderModelToEntity(sp: ServiceProviderModel, entity: ServiceProvider): ServiceProvider {
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
		return newSp;
	}
}
