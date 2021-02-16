import { AvailableTimeslotProviders } from './availableTimeslotProviders';
import {
	AvailabilityEntryResponse,
	TimeslotEntryResponse,
	TimeslotServiceProviderResponse,
} from './timeslots.apicontract';
import { BookingsMapper } from '../bookings/bookings.mapper';
import { TimeslotServiceProviderResult } from '../../models/timeslotServiceProvider';
import { ServiceProviderSummaryModel } from '../serviceProviders/serviceProviders.apicontract';
import { UserContextSnapshot } from '../../infrastructure/auth/userContext';

export class TimeslotsMapper {
	public static mapAvailabilityToResponse(entries: AvailableTimeslotProviders[]): AvailabilityEntryResponse[] {
		return entries.map((e) => this.mapAvailabilityItem(e));
	}

	private static mapAvailabilityItem(entry: AvailableTimeslotProviders): AvailabilityEntryResponse {
		const response = new AvailabilityEntryResponse();
		response.startTime = entry.startTime;
		response.endTime = entry.endTime;
		response.availabilityCount = entry.getAvailabilityCount();
		return response;
	}

	public static mapTimeslotEntry(
		entry: AvailableTimeslotProviders,
		userContext: UserContextSnapshot,
	): TimeslotEntryResponse {
		const [
			timeslotServiceProviders,
			totalCapacity,
			totalAssignedBookings,
		] = TimeslotsMapper.mapTimeslotServiceProviders(Array.from(entry.getTimeslotServiceProviders()), userContext);
		const response = new TimeslotEntryResponse();
		response.startTime = entry.startTime;
		response.endTime = entry.endTime;
		response.timeslotServiceProviders = timeslotServiceProviders;
		response.totalAssignedBookingCount = totalAssignedBookings;
		response.totalUnassignedBookingCount = entry.unassignedPendingBookingCount;
		response.totalAvailabilityCount = entry.getAvailabilityCount();
		response.totalCapacity = totalCapacity;
		return response;
	}

	public static mapTimeslotServiceProviders(
		entries: TimeslotServiceProviderResult[],
		userContext: UserContextSnapshot,
	): [TimeslotServiceProviderResponse[], number, number] {
		let totalCapacity = 0;
		let totalAssignedBookings = 0;
		const res = entries.map((entry) => {
			const item = this.mapServiceProviderTimeslot(entry, userContext);
			totalCapacity += item.capacity;
			totalAssignedBookings += item.assignedBookingCount;
			return item;
		});

		return [res, totalCapacity, totalAssignedBookings];
	}

	private static mapServiceProviderTimeslot(
		entry: TimeslotServiceProviderResult,
		userContext: UserContextSnapshot,
	): TimeslotServiceProviderResponse {
		const item = new TimeslotServiceProviderResponse();
		item.capacity = entry.capacity;
		item.serviceProvider = new ServiceProviderSummaryModel(entry.serviceProvider.id, entry.serviceProvider.name);
		item.assignedBookingCount = entry.acceptedBookings.length + entry.pendingBookings.length;
		item.availabilityCount = entry.availabilityCount;
		item.acceptedBookings = entry.acceptedBookings.map((booking) => {
			return BookingsMapper.mapDataModel(booking, userContext);
		});
		item.pendingBookings = entry.pendingBookings.map((booking) => {
			return BookingsMapper.mapDataModel(booking, userContext);
		});
		return item;
	}
}
