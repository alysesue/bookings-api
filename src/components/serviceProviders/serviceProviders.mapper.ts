import { Inject, InRequestScope } from 'typescript-ioc';
import { Booking, ServiceProvider } from '../../models';
import { CalendarsMapper } from '../calendars/calendars.mapper';
import { ServiceProviderResponseModel, ServiceProviderSummaryModel } from './serviceProviders.apicontract';
import { mapToTimeslotsScheduleResponse } from '../timeslotItems/timeslotItems.mapper';
import { mapToResponse as mapScheduleFormResponse } from '../scheduleForms/scheduleForms.mapper';

@InRequestScope
export class ServiceProvidersMapper {
	@Inject
	private calendarsMapper: CalendarsMapper;

	public mapDataModel(spData: ServiceProvider): ServiceProviderResponseModel {
		const mappedCalendar = this.calendarsMapper.mapDataModel(spData.calendar);
		const mappedTimeslotSchedule = mapToTimeslotsScheduleResponse(spData.timeslotsSchedule);
		const mappedScheduleForm = mapScheduleFormResponse(spData.scheduleForm);
		const response = new ServiceProviderResponseModel(
			spData.id,
			spData.name,
			mappedCalendar,
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
