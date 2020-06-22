import { Inject, InRequestScope } from "typescript-ioc";
import { ServiceProvider } from "../models";
import { CalendarsMapper } from "../calendars/calendars.mapper";
import { ServiceProviderResponseModel, ServiceProviderSummaryModel } from "./serviceProviders.apicontract";

@InRequestScope
export class ServiceprovidersMapper {
	@Inject
	private calendarsMapper: CalendarsMapper;

	public mapDataModel(spData: ServiceProvider): ServiceProviderResponseModel {
		const mappedCalendar = this.calendarsMapper.mapDataModel(spData.calendar);
		return new ServiceProviderResponseModel(spData.id, spData.name, mappedCalendar, spData.serviceId);
	}

	public mapDataModels(spList: ServiceProvider[]): ServiceProviderResponseModel[] {
		return spList?.map(e => this.mapDataModel(e));
	}

	public mapSummaryDataModel(data: ServiceProvider): ServiceProviderSummaryModel {
		return new ServiceProviderSummaryModel(data.id, data.name);
	}
}
