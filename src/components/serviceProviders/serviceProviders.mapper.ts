import { InRequestScope } from 'typescript-ioc';
import { Service, ServiceProvider, ServiceProviderGroupMap } from '../../models';
import {
	MolServiceProviderOnboard,
	ServiceProviderModel,
	ServiceProviderResponseModel,
	ServiceProviderSummaryModel,
} from './serviceProviders.apicontract';
import { mapToTimeslotsScheduleResponse } from '../timeslotItems/timeslotItems.mapper';
import { mapToResponse as mapScheduleFormResponse } from '../scheduleForms/scheduleForms.mapper';

@InRequestScope
export class ServiceProvidersMapper {
	public mapDataModel(spData: ServiceProvider): ServiceProviderResponseModel {
		const mappedTimeslotSchedule = mapToTimeslotsScheduleResponse(spData.timeslotsSchedule);
		const mappedScheduleForm = mapScheduleFormResponse(spData.scheduleForm);

		const response = new ServiceProviderResponseModel();
		response.id = spData.id;
		response.name = spData.name;
		response.serviceId = spData.serviceId;
		response.email = spData.email;
		response.phone = spData.phone;
		response.expiryDate = spData.expiryDate;
		response.scheduleFormConfirmed = spData.scheduleFormConfirmed;
		response.agencyUserId = spData.agencyUserId;
		response.timeslotsSchedule = mappedTimeslotSchedule;
		response.scheduleForm = mappedScheduleForm;
		response.onHoldEnabled = spData.service?.isOnHold;

		return response;
	}

	public mapDataModels(spList: ServiceProvider[]): ServiceProviderResponseModel[] {
		return spList?.map((e) => this.mapDataModel(e));
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
		newSp.expiryDate = new Date(sp.expiryDate);

		return newSp;
	}
}
