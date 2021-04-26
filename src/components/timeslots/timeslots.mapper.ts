import { AvailableTimeslotProviders } from './availableTimeslotProviders';
import {
	AvailabilityEntryResponse,
	CitizenTimeslotServiceProviderResponse,
	TimeslotEntryResponse,
	TimeslotServiceProviderResponse,
} from './timeslots.apicontract';
import { BookingsMapper } from '../bookings/bookings.mapper';
import { TimeslotServiceProviderResult } from '../../models/timeslotServiceProvider';
import { ServiceProviderSummaryModel } from '../serviceProviders/serviceProviders.apicontract';
import { UserContextSnapshot } from '../../infrastructure/auth/userContext';
import { LabelsMapper } from '../../components/labels/labels.mapper';
import { Inject, InRequestScope } from 'typescript-ioc';

@InRequestScope
export class TimeslotsMapper {
	@Inject
	private bookingsMapper: BookingsMapper;

	@Inject
	public labelsMapper: LabelsMapper;

	public mapAvailabilityToResponse(
		entries: AvailableTimeslotProviders[],
		options: { skipUnavailable?: boolean },
	): AvailabilityEntryResponse[] {
		return entries.map((e) => this.mapAvailabilityItem(e, options)).filter((e) => !!e);
	}

	private mapAvailabilityItem(
		entry: AvailableTimeslotProviders,
		options: { skipUnavailable?: boolean },
	): AvailabilityEntryResponse | undefined {
		const availabilityCount = entry.getAvailabilityCount();
		if (availabilityCount <= 0 && options.skipUnavailable) {
			return undefined;
		}

		const [timeslotServiceProviders] = this.mapCitizenTimeslotServiceProviders(
			Array.from(entry.getTimeslotServiceProviders()),
		);

		const response = new AvailabilityEntryResponse();
		response.startTime = new Date(entry.startTime);
		response.endTime = new Date(entry.endTime);
		response.availabilityCount = availabilityCount;
		response.timeslotServiceProviders = timeslotServiceProviders;
		return response;
	}

	public mapTimeslotEntry(
		entry: AvailableTimeslotProviders,
		userContext: UserContextSnapshot,
	): TimeslotEntryResponse {
		const [timeslotServiceProviders, totalCapacity, totalAssignedBookings] = this.mapTimeslotServiceProviders(
			Array.from(entry.getTimeslotServiceProviders()),
			userContext,
		);
		const response = new TimeslotEntryResponse();
		response.startTime = new Date(entry.startTime);
		response.endTime = new Date(entry.endTime);
		response.timeslotServiceProviders = timeslotServiceProviders;
		response.totalAssignedBookingCount = totalAssignedBookings;
		response.totalUnassignedBookingCount = entry.unassignedPendingBookingCount;
		response.totalAvailabilityCount = entry.getAvailabilityCount();
		response.totalCapacity = totalCapacity;
		return response;
	}

	public mapTimeslotServiceProviders(
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

	public mapCitizenTimeslotServiceProviders(
		entries: TimeslotServiceProviderResult[],
	): [CitizenTimeslotServiceProviderResponse[]] {
		const res = entries.map((entry) => {
			const item = this.mapCitizenServiceProviderTimeslot(entry);
			return item;
		});
		return [res];
	}

	private mapCitizenServiceProviderTimeslot(
		entry: TimeslotServiceProviderResult,
	): CitizenTimeslotServiceProviderResponse {
		const item = new CitizenTimeslotServiceProviderResponse();
		item.serviceProvider = new ServiceProviderSummaryModel(entry.serviceProvider.id, entry.serviceProvider.name);
		item.eventTitle = entry.title ?? undefined;
		item.eventDescription = entry.description ?? undefined;
		return item;
	}

	private mapServiceProviderTimeslot(
		entry: TimeslotServiceProviderResult,
		userContext: UserContextSnapshot,
	): TimeslotServiceProviderResponse {
		const item = new TimeslotServiceProviderResponse();
		item.capacity = entry.capacity;
		item.serviceProvider = new ServiceProviderSummaryModel(entry.serviceProvider.id, entry.serviceProvider.name);
		item.assignedBookingCount = entry.acceptedBookings.length + entry.pendingBookings.length;
		item.availabilityCount = entry.availabilityCount;
		item.acceptedBookings = entry.acceptedBookings.map((booking) => {
			return this.bookingsMapper.mapDataModel(booking, userContext);
		});
		item.pendingBookings = entry.pendingBookings.map((booking) => {
			return this.bookingsMapper.mapDataModel(booking, userContext);
		});
		item.oneOffTimeslotId = entry.oneOffTimeslotId;
		item.labels = this.labelsMapper.mapToLabelsResponse(entry.labels);
		item.eventTitle = entry.title ?? undefined;
		item.eventDescription = entry.description ?? undefined;
		return item;
	}
}
