import { DateHelper } from '../../infrastructure/dateHelper';
import { Inject, InRequestScope } from 'typescript-ioc';
import { AvailableTimeslotProviders } from './availableTimeslotProviders';
import {
	AvailabilityByDayResponse,
	AvailabilityEntryResponseV1,
	AvailabilityEntryResponseV2,
	CitizenTimeslotServiceProviderResponseV1,
	CitizenTimeslotServiceProviderResponseV2,
	TimeslotEntryResponseV1,
	TimeslotEntryResponseV2,
	TimeslotServiceProviderResponseV1,
	TimeslotServiceProviderResponseV2,
} from './timeslots.apicontract';
import { BookingsMapper } from '../bookings/bookings.mapper';
import { TimeslotServiceProviderResult } from '../../models/timeslotServiceProvider';
import { LabelsMapper } from '../labels/labels.mapper';
import { IdHasher } from '../../infrastructure/idHasher';
import { TimeslotWithCapacity } from '../../models/timeslotWithCapacity';
import { Event } from '../../models';
import {
	ServiceProviderSummaryModelV1,
	ServiceProviderSummaryModelV2,
} from '../serviceProviders/serviceProviders.apicontract';

@InRequestScope
export class TimeslotsMapperV1 {
	@Inject
	private bookingsMapper: BookingsMapper;

	@Inject
	public labelsMapper: LabelsMapper;

	@Inject
	public idHasher: IdHasher;

	public mapAvailabilityToResponseV1(
		entries: AvailableTimeslotProviders[],
		options: { skipUnavailable?: boolean; exactTimeslot?: boolean },
	): AvailabilityEntryResponseV1[] {
		return entries.map((e) => this.mapAvailabilityItemV1(e, options)).filter((e) => !!e);
	}

	private mapAvailabilityItemV1(
		entry: AvailableTimeslotProviders,
		options: { skipUnavailable?: boolean; exactTimeslot?: boolean },
	): AvailabilityEntryResponseV1 | undefined {
		const availabilityCount = entry.getAvailabilityCount();
		if (availabilityCount <= 0 && options.skipUnavailable) {
			return undefined;
		}

		const response = new AvailabilityEntryResponseV1();
		response.startTime = new Date(entry.startTime);
		response.endTime = new Date(entry.endTime);
		response.availabilityCount = availabilityCount;

		if (options.exactTimeslot) {
			response.timeslotServiceProviders = this.mapCitizenTimeslotServiceProvidersV1(
				Array.from(entry.getTimeslotServiceProviders()),
			);
		}

		return response;
	}

	public async mapTimeslotEntryV1(entry: AvailableTimeslotProviders): Promise<TimeslotEntryResponseV1> {
		const [
			timeslotServiceProviders,
			totalCapacity,
			totalAssignedBookings,
		] = await this.mapTimeslotServiceProvidersV1(Array.from(entry.getTimeslotServiceProviders()));
		const response = new TimeslotEntryResponseV1();
		response.startTime = new Date(entry.startTime);
		response.endTime = new Date(entry.endTime);
		response.timeslotServiceProviders = timeslotServiceProviders;
		response.totalAssignedBookingCount = totalAssignedBookings;
		response.totalUnassignedBookingCount = entry.unassignedPendingBookingCount;
		response.totalAvailabilityCount = entry.getAvailabilityCount();
		response.totalCapacity = totalCapacity;
		return response;
	}

	public async mapTimeslotServiceProvidersV1(
		entries: TimeslotServiceProviderResult[],
	): Promise<[TimeslotServiceProviderResponseV1[], number, number]> {
		let totalCapacity = 0;
		let totalAssignedBookings = 0;
		const mappedTimeslots = [];
		for (const entry of entries) {
			const item = await this.mapServiceProviderTimeslotV1(entry);
			mappedTimeslots.push(item);
			totalCapacity += item.capacity;
			totalAssignedBookings += item.assignedBookingCount;
		}

		return [mappedTimeslots, totalCapacity, totalAssignedBookings];
	}

	public groupAvailabilityByDateResponse(entries: AvailableTimeslotProviders[]): AvailabilityByDayResponse[] {
		const groupByDayMap = new Map<number, number>();

		entries.forEach((entry: AvailableTimeslotProviders) => {
			const startOfDay = DateHelper.getStartOfDay(new Date(entry.startTime)).getTime();
			const currCount =
				groupByDayMap.get(startOfDay) === undefined
					? entry.getAvailabilityCount()
					: entry.getAvailabilityCount() + groupByDayMap.get(startOfDay);
			groupByDayMap.set(startOfDay, currCount);
		});

		const result = Array.from(groupByDayMap, ([date, count]) => {
			return new AvailabilityByDayResponse(new Date(date), count);
		});

		return result;
	}

	public mapCitizenTimeslotServiceProvidersV1(
		entries: TimeslotServiceProviderResult[],
	): CitizenTimeslotServiceProviderResponseV1[] {
		return entries.map((entry) => {
			const item = this.mapCitizenServiceProviderTimeslotV1(entry);
			return item;
		});
	}

	private mapCitizenServiceProviderTimeslotV1(
		entry: TimeslotServiceProviderResult,
	): CitizenTimeslotServiceProviderResponseV1 {
		const item = new CitizenTimeslotServiceProviderResponseV1();
		item.serviceProvider = new ServiceProviderSummaryModelV1(entry.serviceProvider.id, entry.serviceProvider.name);
		item.eventTitle = entry.title ?? undefined;
		item.eventDescription = entry.description ?? undefined;
		return item;
	}

	private async mapServiceProviderTimeslotV1(
		entry: TimeslotServiceProviderResult,
	): Promise<TimeslotServiceProviderResponseV1> {
		const item = new TimeslotServiceProviderResponseV1();
		const acceptedBookings = [];
		const pendingBookings = [];
		for (const booking of entry.acceptedBookings) {
			const mappedBooking = await this.bookingsMapper.mapDataModelV1(booking);
			acceptedBookings.push(mappedBooking);
		}
		for (const booking of entry.pendingBookings) {
			const mappedBooking = await this.bookingsMapper.mapDataModelV1(booking);
			pendingBookings.push(mappedBooking);
		}
		item.acceptedBookings = acceptedBookings;
		item.pendingBookings = pendingBookings;
		item.capacity = entry.capacity;
		item.serviceProvider = new ServiceProviderSummaryModelV1(entry.serviceProvider.id, entry.serviceProvider.name);
		item.assignedBookingCount = entry.acceptedBookings.length + entry.pendingBookings.length;
		item.availabilityCount = entry.availabilityCount;
		if (entry.oneOffTimeslotId) {
			item.oneOffTimeslotId = this.idHasher.encode(entry.oneOffTimeslotId);
		}
		item.labels = this.labelsMapper.mapToLabelsResponse(entry.labels);
		item.eventTitle = entry.title ?? undefined;
		item.eventDescription = entry.description ?? undefined;
		item.isRecurring = entry.isRecurring ?? false;
		return item;
	}
}

@InRequestScope
export class TimeslotsMapperV2 {
	@Inject
	private bookingsMapper: BookingsMapper;

	@Inject
	public labelsMapper: LabelsMapper;

	@Inject
	public idHasher: IdHasher;

	public mapAvailabilityToResponseV2(
		entries: AvailableTimeslotProviders[],
		options: { skipUnavailable?: boolean; exactTimeslot?: boolean },
	): AvailabilityEntryResponseV2[] {
		return entries.map((e) => this.mapAvailabilityItemV2(e, options)).filter((e) => !!e);
	}

	private mapAvailabilityItemV2(
		entry: AvailableTimeslotProviders,
		options: { skipUnavailable?: boolean; exactTimeslot?: boolean },
	): AvailabilityEntryResponseV2 | undefined {
		const availabilityCount = entry.getAvailabilityCount();
		if (availabilityCount <= 0 && options.skipUnavailable) {
			return undefined;
		}

		const response = new AvailabilityEntryResponseV2();
		response.startTime = new Date(entry.startTime);
		response.endTime = new Date(entry.endTime);
		response.availabilityCount = availabilityCount;

		if (options.exactTimeslot) {
			response.timeslotServiceProviders = this.mapCitizenTimeslotServiceProvidersV2(
				Array.from(entry.getTimeslotServiceProviders()),
			);
		}

		return response;
	}

	public async mapTimeslotEntryV2(entry: AvailableTimeslotProviders): Promise<TimeslotEntryResponseV2> {
		const [
			timeslotServiceProviders,
			totalCapacity,
			totalAssignedBookings,
		] = await this.mapTimeslotServiceProvidersV2(Array.from(entry.getTimeslotServiceProviders()));
		const response = new TimeslotEntryResponseV2();
		response.startTime = new Date(entry.startTime);
		response.endTime = new Date(entry.endTime);
		response.timeslotServiceProviders = timeslotServiceProviders;
		response.totalAssignedBookingCount = totalAssignedBookings;
		response.totalUnassignedBookingCount = entry.unassignedPendingBookingCount;
		response.totalAvailabilityCount = entry.getAvailabilityCount();
		response.totalCapacity = totalCapacity;
		return response;
	}

	public async mapTimeslotServiceProvidersV2(
		entries: TimeslotServiceProviderResult[],
	): Promise<[TimeslotServiceProviderResponseV2[], number, number]> {
		let totalCapacity = 0;
		let totalAssignedBookings = 0;
		const mappedTimeslots = [];
		for (const entry of entries) {
			const item = await this.mapServiceProviderTimeslotV2(entry);
			mappedTimeslots.push(item);
			totalCapacity += item.capacity;
			totalAssignedBookings += item.assignedBookingCount;
		}

		return [mappedTimeslots, totalCapacity, totalAssignedBookings];
	}

	public mapCitizenTimeslotServiceProvidersV2(
		entries: TimeslotServiceProviderResult[],
	): CitizenTimeslotServiceProviderResponseV2[] {
		return entries.map((entry) => {
			const item = this.mapCitizenServiceProviderTimeslotV2(entry);
			return item;
		});
	}

	private mapCitizenServiceProviderTimeslotV2(
		entry: TimeslotServiceProviderResult,
	): CitizenTimeslotServiceProviderResponseV2 {
		const item = new CitizenTimeslotServiceProviderResponseV2();
		const signedServiceProviderId = this.idHasher.encode(entry.serviceProvider.id);
		item.serviceProvider = new ServiceProviderSummaryModelV2(signedServiceProviderId, entry.serviceProvider.name);
		item.eventTitle = entry.title ?? undefined;
		item.eventDescription = entry.description ?? undefined;
		return item;
	}

	private async mapServiceProviderTimeslotV2(
		entry: TimeslotServiceProviderResult,
	): Promise<TimeslotServiceProviderResponseV2> {
		const signedServiceProviderId = this.idHasher.encode(entry.serviceProvider.id);
		const item = new TimeslotServiceProviderResponseV2();
		const acceptedBookings = [];
		const pendingBookings = [];
		for (const booking of entry.acceptedBookings) {
			const mappedBooking = await this.bookingsMapper.mapDataModelV2(booking);
			acceptedBookings.push(mappedBooking);
		}
		for (const booking of entry.pendingBookings) {
			const mappedBooking = await this.bookingsMapper.mapDataModelV2(booking);
			pendingBookings.push(mappedBooking);
		}
		item.acceptedBookings = acceptedBookings;
		item.pendingBookings = pendingBookings;
		item.capacity = entry.capacity;
		item.serviceProvider = new ServiceProviderSummaryModelV2(signedServiceProviderId, entry.serviceProvider.name);
		item.assignedBookingCount = entry.acceptedBookings.length + entry.pendingBookings.length;
		item.availabilityCount = entry.availabilityCount;
		if (entry.oneOffTimeslotId) {
			item.oneOffTimeslotId = this.idHasher.encode(entry.oneOffTimeslotId);
		}
		item.labels = this.labelsMapper.mapToLabelsResponse(entry.labels);
		item.eventTitle = entry.title ?? undefined;
		item.eventDescription = entry.description ?? undefined;
		item.isRecurring = entry.isRecurring ?? false;
		return item;
	}

	public mapEventWithOneTimeslotToTimeslotWithCapacity(e: Event): TimeslotWithCapacity {
		return {
			oneOffTimeslotId: e.id,
			serviceProviderId: e.oneOffTimeslots[0].serviceProviderId,
			title: e.title,
			capacity: e.capacity,
			description: e.description,
			startTimeNative: e.oneOffTimeslots[0].startTimeNative,
			endTimeNative: e.oneOffTimeslots[0].endTimeNative,
			isRecurring: false,
			labels: e.labels,
		};
	}
}
