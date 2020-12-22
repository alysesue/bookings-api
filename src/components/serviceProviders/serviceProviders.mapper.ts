import { InRequestScope } from 'typescript-ioc';
import { Service, ServiceProvider, ServiceProviderGroupMap } from '../../models';
import {
	MolServiceProviderOnboard,
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
		response.scheduleFormConfirmed = spData.scheduleFormConfirmed;
		response.agencyUserId = spData.agencyUserId;
		response.timeslotsSchedule = mappedTimeslotSchedule;
		response.scheduleForm = mappedScheduleForm;

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

	public mapToEntity(sp: MolServiceProviderOnboard, service: Service): ServiceProvider {
		const spCreated = ServiceProvider.create(
			sp.name,
			service?.id,
			sp.email,
			sp.phoneNumber,
			sp.agencyUserId,
			sp.autoAcceptBookings,
		);
		spCreated.service = service;
		spCreated.serviceProviderGroupMap = new ServiceProviderGroupMap();
		spCreated.serviceProviderGroupMap.molAdminId = sp.molAdminId;
		return spCreated;
	}
}
