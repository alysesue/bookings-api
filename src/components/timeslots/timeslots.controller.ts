import { Inject } from 'typescript-ioc';
import { Controller, Get, Header, Query, Response, Route, Security, Tags } from 'tsoa';
import {
	AvailabilityEntryResponse,
	ServiceProviderTimeslotResponse,
	TimeslotEntryResponse,
} from './timeslots.apicontract';
import { TimeslotsService } from './timeslots.service';
import { AvailableTimeslotProviders } from './availableTimeslotProviders';
import { ServiceProvidersMapper } from '../serviceProviders/serviceProviders.mapper';
import { MOLAuth } from 'mol-lib-common';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth/auth-forwarder/common/MOLUserAuthLevel';
import { ServiceProviderTimeslot } from '../../models/serviceProviderTimeslot';
import { ServiceProviderWithBookingsModel } from '../serviceProviders/serviceProviders.apicontract';
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
		let availableTimeslots = await this.timeslotsService.getAggregatedTimeslots(
			startDate,
			endDate,
			serviceId,
			false,
			serviceProviderId,
		);
		availableTimeslots = availableTimeslots.filter((e) => e.availabilityCount > 0);
		return ApiDataFactory.create(TimeslotsController.mapAvailabilityToResponse(availableTimeslots));
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
		response.availabilityCount = entry.availabilityCount;
		return response;
	}

	private mapTimeslotEntry(entry: AvailableTimeslotProviders): TimeslotEntryResponse {
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

	private mapServiceProviderTimeslot(
		entry: ServiceProviderTimeslot[],
	): [ServiceProviderTimeslotResponse[], number, number] {
		let totalCapacity = 0;
		let totalBooked = 0;
		const res = entry.map((i) => {
			const item = new ServiceProviderTimeslotResponse();
			item.capacity = i.capacity;
			item.serviceProvider = new ServiceProviderWithBookingsModel(
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
