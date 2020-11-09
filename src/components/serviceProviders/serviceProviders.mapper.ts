import { InRequestScope } from 'typescript-ioc';
import { ServiceProvider } from '../../models';
import { ServiceProviderResponseModel, ServiceProviderSummaryModel } from './serviceProviders.apicontract';
import { mapToTimeslotsScheduleResponse } from '../timeslotItems/timeslotItems.mapper';
import { mapToResponse as mapScheduleFormResponse } from '../scheduleForms/scheduleForms.mapper';

@InRequestScope
export class ServiceProvidersMapper {
	public mapDataModel(spData: ServiceProvider): ServiceProviderResponseModel {
		const mappedTimeslotSchedule = mapToTimeslotsScheduleResponse(spData.timeslotsSchedule);
		const mappedScheduleForm = mapScheduleFormResponse(spData.scheduleForm);
		const response = new ServiceProviderResponseModel(
			spData.id,
			spData.name,
			spData.serviceId,
			mappedTimeslotSchedule,
			mappedScheduleForm,
			spData.email,
			spData.phone,
		);
		response.agencyUserId = spData.agencyUserId;

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
}
