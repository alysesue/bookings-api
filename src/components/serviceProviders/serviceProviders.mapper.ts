import { Inject, InRequestScope } from 'typescript-ioc';
import { Booking, ServiceProvider } from '../../models';
import { CalendarsMapper } from '../calendars/calendars.mapper';
import { ServiceProviderResponseModel, ServiceProviderSummaryModel } from './serviceProviders.apicontract';
import { mapToTimeslotsScheduleResponse } from '../timeslotItems/timeslotItems.mapper';
import { BookingResponse } from '../bookings/bookings.apicontract';
import { BookingsMapper } from '../bookings/bookings.mapper';
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

	public mapSummaryDataModel(entry: ServiceProvider, bookings?: BookingResponse[]): ServiceProviderSummaryModel {
		return new ServiceProviderSummaryModel(entry.id, entry.name, bookings);
	}

	public mapSummaryDataModels(entries: ServiceProvider[]): ServiceProviderSummaryModel[] {
		return entries?.map((e) => this.mapSummaryDataModel(e));
	}

	public mapBookedServiceProviderEntries(entries: Map<ServiceProvider, Booking[]>): ServiceProviderSummaryModel[] {
		const result: ServiceProviderSummaryModel[] = [];

		entries?.forEach((bookings, serviceProvider) => {
			result.push(this.mapSummaryDataModel(serviceProvider, BookingsMapper.mapDataModels(bookings)));
		});
		return result;
	}
}
