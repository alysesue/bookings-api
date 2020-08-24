import { Inject, InRequestScope } from "typescript-ioc";
import { ServiceProvider } from "../../models";
import { Booking } from "../../models";
import { CalendarsMapper } from "../calendars/calendars.mapper";
import { ServiceProviderResponseModel, ServiceProviderSummaryModel } from "./serviceProviders.apicontract";
import { mapToTimeslotsScheduleResponse } from "../timeslotItems/timeslotItems.mapper";
import { BookingResponse } from "../bookings/bookings.apicontract";
import {BookingsMapper} from "../bookings/bookings.mapper";

@InRequestScope
export class ServiceprovidersMapper {
	@Inject
	private calendarsMapper: CalendarsMapper;

	@Inject
	private bookingsMapper: BookingsMapper;

	public mapDataModel(spData: ServiceProvider): ServiceProviderResponseModel {
		const mappedCalendar = this.calendarsMapper.mapDataModel(spData.calendar);
		const mappedTimeslotSchedule = mapToTimeslotsScheduleResponse(spData.timeslotsSchedule);
		return new ServiceProviderResponseModel(spData.id, spData.name, mappedCalendar, spData.serviceId, mappedTimeslotSchedule, spData.email);
	}

	public mapDataModels(spList: ServiceProvider[]): ServiceProviderResponseModel[] {
		return spList?.map(e => this.mapDataModel(e));
	}

	public mapSummaryDataModel(entry: ServiceProvider, bookings?: BookingResponse[]): ServiceProviderSummaryModel {
		return new ServiceProviderSummaryModel(entry.id, entry.name, bookings);
	}

	public mapSummaryDataModels(entries: ServiceProvider[]): ServiceProviderSummaryModel[] {
		return entries?.map(e => this.mapSummaryDataModel(e));
	}

	public mapBookedServiceProviderEntries(entries: ServiceProvider[], bookings: Booking[]): ServiceProviderSummaryModel[] {
		return entries.map(item => this.mapSummaryDataModel(
			item, this.bookingsMapper.mapDataModels(bookings.filter(booking => booking.serviceProviderId === item.id))));
	}
}
