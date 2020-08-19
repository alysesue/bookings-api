import { Inject, InRequestScope } from "typescript-ioc";
import { ServiceProvider } from "../../models";
import { CalendarsMapper } from "../calendars/calendars.mapper";
import { ServiceProviderResponseModel, ServiceProviderSummaryModel } from "./serviceProviders.apicontract";
import { mapToTimeslotsScheduleResponse } from "../timeslotItems/timeslotItems.mapper";

@InRequestScope
export class ServiceprovidersMapper {
	@Inject
	private calendarsMapper: CalendarsMapper;

	public mapDataModel(spData: ServiceProvider): ServiceProviderResponseModel {
		const mappedCalendar = this.calendarsMapper.mapDataModel(spData.calendar);
		const mappedTimeslotSchedule = mapToTimeslotsScheduleResponse(spData.timeslotsSchedule);
		return new ServiceProviderResponseModel(spData.id, spData.name, mappedCalendar, spData.serviceId, mappedTimeslotSchedule, spData.email);
	}

	public mapDataModels(spList: ServiceProvider[]): ServiceProviderResponseModel[] {
		return spList?.map(e => this.mapDataModel(e));
	}

	public mapSummaryDataModel(entry: ServiceProvider): ServiceProviderSummaryModel {
		return new ServiceProviderSummaryModel(entry.id, entry.name);
	}

	public mapSummaryDataModels(entries: ServiceProvider[]): ServiceProviderSummaryModel[] {
		return entries?.map(e => this.mapSummaryDataModel(e));
	}
}
