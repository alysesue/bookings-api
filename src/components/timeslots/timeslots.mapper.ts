import { AvailableTimeslotProviders } from "./availableTimeslotProviders";
import { AvailabilityEntryResponse, TimeslotEntryResponse, ServiceProviderTimeslotResponse } from "./timeslots.apicontract";
import { ServiceProviderTimeslot } from "../../models/serviceProviderTimeslot";
import { ServiceProviderSummaryModel } from "../serviceProviders/serviceProviders.apicontract";
import { BookingsMapper } from "../bookings/bookings.mapper";

export class TimeslotsMapper {


	public static mapAvailabilityToResponse(entries: AvailableTimeslotProviders[]): AvailabilityEntryResponse[] {
		return entries.map((e) => this.mapAvailabilityItem(e));
	}

	public static mapAvailabilityItem(entry: AvailableTimeslotProviders): AvailabilityEntryResponse {
		const response = new AvailabilityEntryResponse();
		response.startTime = entry.startTime;
		response.endTime = entry.endTime;
		response.availabilityCount = entry.availabilityCount;
		return response;
	}

	public static mapTimeslotEntry(entry: AvailableTimeslotProviders): TimeslotEntryResponse {
		const [timeslots, totalCapacity, totalBooked] = this.mapServiceProviderTimeslot(
			Array.from(entry.serviceProviderTimeslots.values()),
		);
		const response = new TimeslotEntryResponse();
		response.startTime = entry.startTime;
		response.endTime = entry.endTime;
		response.serviceProviderTimeslot = timeslots;
		response.totalBookingCount = totalBooked;
		response.totalCapacity = totalCapacity;
		return response;
	}

	public static mapServiceProviderTimeslot(
		entry: ServiceProviderTimeslot[],
	): [ServiceProviderTimeslotResponse[], number, number] {
		let totalCapacity = 0;
		let totalBooked = 0;
		const res = entry.map((i) => {
			const item = new ServiceProviderTimeslotResponse();
			item.capacity = i.capacity;
			item.serviceProvider = new ServiceProviderSummaryModel(
				i.serviceProvider.id,
				i.serviceProvider.name
			);
			item.bookingCount = i.acceptedBookings.length + i.pendingBookings.length;
			item.acceptedBookings = i.acceptedBookings.map(BookingsMapper.mapDataModel);
			item.pendingBookings = i.pendingBookings.map(BookingsMapper.mapDataModel);
			totalCapacity += item.capacity;
			totalBooked += item.bookingCount;
			return item;
		});

		return [res, totalCapacity, totalBooked];
	}
}
