import { InRequestScope } from 'typescript-ioc';
import { Service, ServiceProvider, ServiceProviderGroupMap } from '../../models';
import { mapToTimeslotsScheduleResponse } from '../timeslotItems/timeslotItems.mapper';
import { mapToResponse as mapScheduleFormResponse } from '../scheduleForms/scheduleForms.mapper';
import {
	MolServiceProviderOnboard,
	ServiceProviderModel,
	ServiceProviderResponseModel,
	ServiceProviderSummaryModel,
} from './serviceProviders.apicontract';

@InRequestScope
export class ServiceProvidersMapper {
	public mapDataModel(
		spData: ServiceProvider,
		options: { includeTimeslotsSchedule?: boolean; includeScheduleForm?: boolean },
	): ServiceProviderResponseModel {
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
		response.email = spData.email;
		response.phone = spData.phone;
		response.expiryDate = spData.expiryDate;
		response.scheduleFormConfirmed = spData.scheduleFormConfirmed;
		response.agencyUserId = spData.agencyUserId;
		response.description = spData?.description;
		response.aliasName = spData.aliasName;

		response.onHoldEnabled = spData.service?.isOnHold;

		return response;
	}

	public mapDataModels(
		spList: ServiceProvider[],
		options: { includeTimeslotsSchedule?: boolean; includeScheduleForm?: boolean },
	): ServiceProviderResponseModel[] {
		return spList?.map((e) => this.mapDataModel(e, options));
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
