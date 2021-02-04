import { AvailableTimeslotProviders } from './availableTimeslotProviders';
import {
	AvailabilityEntryResponse,
	TimeslotEntryResponse,
	TimeslotServiceProviderResponse,
} from './timeslots.apicontract';
import { BookingsMapper } from '../bookings/bookings.mapper';
import { TimeslotServiceProviderResult } from '../../models/timeslotServiceProvider';
import { ServiceProviderSummaryModel } from '../serviceProviders/serviceProviders.apicontract';
import { User } from '../../models';

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

	public static mapTimeslotEntry(entry: AvailableTimeslotProviders, currentUser: User): TimeslotEntryResponse {
		const [
			timeslotServiceProviders,
			totalCapacity,
			totalAssignedBookings,
		] = TimeslotsMapper.mapTimeslotServiceProviders(Array.from(entry.getTimeslotServiceProviders()), currentUser);
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
		currentUser: User,
	): [TimeslotServiceProviderResponse[], number, number] {
		let totalCapacity = 0;
		let totalAssignedBookings = 0;
		const res = entries.map((entry) => {
			const item = this.mapServiceProviderTimeslot(entry, currentUser);
			totalCapacity += item.capacity;
			totalAssignedBookings += item.assignedBookingCount;
			return item;
		});

		return [res, totalCapacity, totalAssignedBookings];
	}

	private static mapServiceProviderTimeslot(
		entry: TimeslotServiceProviderResult,
		currentUser: User,
	): TimeslotServiceProviderResponse {
		const item = new TimeslotServiceProviderResponse();
		item.capacity = entry.capacity;
		item.serviceProvider = new ServiceProviderSummaryModel(entry.serviceProvider.id, entry.serviceProvider.name);
		item.assignedBookingCount = entry.acceptedBookings.length + entry.pendingBookings.length;
		item.availabilityCount = entry.availabilityCount;
		item.acceptedBookings = entry.acceptedBookings.map((booking) => {
			return BookingsMapper.mapDataModel(booking, currentUser);
		});
		item.pendingBookings = entry.pendingBookings.map((booking) => {
			return BookingsMapper.mapDataModel(booking, currentUser);
		});
		return item;
	}
}
