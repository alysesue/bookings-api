import { Inject } from 'typescript-ioc';
import { Controller, Get, Header, Query, Response, Route, Security, Tags } from 'tsoa';
import {
	AvailabilityEntryResponse,
	TimeslotEntryResponse,
	TimeslotServiceProviderResponse,
} from './timeslots.apicontract';
import { TimeslotsService } from './timeslots.service';
import { AvailableTimeslotProviders } from './availableTimeslotProviders';
import { ServiceProvidersMapper } from '../serviceProviders/serviceProviders.mapper';
import { MOLAuth } from 'mol-lib-common';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth/auth-forwarder/common/MOLUserAuthLevel';
import { TimeslotServiceProviderResult } from '../../models/timeslotServiceProvider';
import { BookingsMapper } from '../bookings/bookings.mapper';
import { ApiData, ApiDataFactory } from '../../apicontract';

@Route('v1/timeslots')
@Tags('Timeslots')
export class TimeslotsController extends Controller {
	@Inject
	private timeslotsService: TimeslotsService;

	@Inject
	private serviceProviderMapper: ServiceProvidersMapper;

	/**
	 * Retrieves available timeslots for a service in a defined datetime range [startDate, endDate].
	 * Availability count returned will be at least 1.
	 * Pending and accepted bookings count towards availability quota.
	 * @param startDate The lower bound limit for timeslots' startDate.
	 * @param endDate The upper bound limit for timeslots' endDate.
	 * @param @isInt serviceId The available service to be queried.
	 * @param @isInt serviceProviderId (Optional) Filters timeslots for a specific service provider.
	 */
	@Get('availability')
	@Security('service')
	@MOLAuth({
		admin: {},
		agency: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,agency,user]')
	public async getAvailability(
		@Query() startDate: Date,
		@Query() endDate: Date,
		@Header('x-api-service') serviceId: number,
		@Query() serviceProviderId?: number,
	): Promise<ApiData<AvailabilityEntryResponse[]>> {
		const availableTimeslots = await this.timeslotsService.getAggregatedTimeslots(
			startDate,
			endDate,
			serviceId,
			false,
			serviceProviderId,
		);
		let result = TimeslotsController.mapAvailabilityToResponse(availableTimeslots);
		result = result.filter((e) => e.availabilityCount > 0);

		return ApiDataFactory.create(result);
	}

	/**
	 * Retrieves timeslots (available and booked) and accepted bookings for a service in a defined datetime range [startDate, endDate].
	 * Availability count returned may be zero.
	 * Pending and accepted bookings count towards availability quota.
	 * @param startDate The lower bound limit for timeslots' startDate.
	 * @param endDate The upper bound limit for timeslots' endDate.
	 * @param @isInt serviceId The available service to be queried.
	 * @param @isInt serviceProviderId (Optional) Filters timeslots for a specific service provider.
	 * @param includeBookings (Optional)
	 */
	@Get('')
	@Security('service')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getTimeslots(
		@Query() startDate: Date,
		@Query() endDate: Date,
		@Header('x-api-service') serviceId: number,
		@Query() includeBookings: boolean = false,
		@Query() serviceProviderId?: number,
	): Promise<ApiData<TimeslotEntryResponse[]>> {
		const timeslots = await this.timeslotsService.getAggregatedTimeslots(
			startDate,
			endDate,
			serviceId,
			includeBookings,
			serviceProviderId,
		);
		return ApiDataFactory.create(timeslots?.map((t) => this.mapTimeslotEntry(t)));
	}

	private static mapAvailabilityToResponse(entries: AvailableTimeslotProviders[]): AvailabilityEntryResponse[] {
		return entries.map((e) => this.mapAvailabilityEntry(e));
	}

	private static mapAvailabilityEntry(entry: AvailableTimeslotProviders): AvailabilityEntryResponse {
		const response = new AvailabilityEntryResponse();
		response.startTime = entry.startTime;
		response.endTime = entry.endTime;
		response.availabilityCount = entry.getAvailabilityCount();
		return response;
	}

	private mapTimeslotEntry(entry: AvailableTimeslotProviders): TimeslotEntryResponse {
		const [timeslotServiceProviders, totalCapacity, totalAssignedBookings] = this.mapTimeslotServiceProviders(
			Array.from(entry.getTimeslotServiceProviders()),
		);
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

	private mapTimeslotServiceProviders(
		entries: TimeslotServiceProviderResult[],
	): [TimeslotServiceProviderResponse[], number, number] {
		let totalCapacity = 0;
		let totalAssignedBookings = 0;
		const res = entries.map((entry) => {
			const item = this.mapServiceProviderTimeslot(entry);
			totalCapacity += item.capacity;
			totalAssignedBookings += item.assignedBookingCount;
			return item;
		});

		return [res, totalCapacity, totalAssignedBookings];
	}

	private mapServiceProviderTimeslot(entry: TimeslotServiceProviderResult): TimeslotServiceProviderResponse {
		const item = new TimeslotServiceProviderResponse();
		item.capacity = entry.capacity;
		item.serviceProvider = this.serviceProviderMapper.mapSummaryDataModel(entry.serviceProvider);
		item.assignedBookingCount = entry.acceptedBookings.length + entry.pendingBookings.length;
		item.availabilityCount = entry.availabilityCount;
		item.acceptedBookings = entry.acceptedBookings.map(BookingsMapper.mapDataModel);
		item.pendingBookings = entry.pendingBookings.map(BookingsMapper.mapDataModel);
		return item;
	}
}
