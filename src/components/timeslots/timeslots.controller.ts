import { Inject } from 'typescript-ioc';
import { Controller, Get, Header, Query, Response, Route, Security, Tags } from 'tsoa';
import { AvailabilityEntryResponse, TimeslotEntryResponse } from './timeslots.apicontract';
import { TimeslotsService } from './timeslots.service';
import { MOLAuth } from 'mol-lib-common';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { TimeslotsMapper } from './timeslots.mapper';
import { UserContext } from '../../infrastructure/auth/userContext';
import { ServiceProviderAuthGroup } from '../../infrastructure/auth/authGroup';

@Route('v1/timeslots')
@Tags('Timeslots')
export class TimeslotsController extends Controller {
	@Inject
	private userContext: UserContext;

	@Inject
	private timeslotsService: TimeslotsService;

	/**
	 * Retrieves available timeslots for a service in a defined datetime range [startDate, endDate].
	 * Availability count returned will be at least 1.
	 * Pending and accepted bookings count towards availability quota.
	 * @param startDate The lower bound limit for timeslots' startDate.
	 * @param endDate The upper bound limit for timeslots' endDate.
	 * @param serviceId
	 * @param serviceProviderId
	 * @param exactTimeslot
	 */
	@Get('availability')
	@Security('service')
	@Response(401, 'Unauthorized')
	public async getAvailability(
		@Query() startDate: Date,
		@Query() endDate: Date,
		@Header('x-api-service') serviceId: number,
		@Query() serviceProviderId?: number,
		@Query() exactTimeslot = false,
	): Promise<ApiData<AvailabilityEntryResponse[]>> {
		let timeslots = await this.timeslotsService.getAggregatedTimeslots(
			startDate,
			endDate,
			serviceId,
			exactTimeslot,
			serviceProviderId ? [serviceProviderId] : undefined,
		);

		if (exactTimeslot) {
			timeslots = timeslots.some((timeslot) => timeslot.getAvailabilityCount() <= 0) ? [] : timeslots;
		}

		const result = TimeslotsMapper.mapAvailabilityToResponse(timeslots, { skipUnavailable: true });

		return ApiDataFactory.create(result);
	}

	private async getServiceProviderAuthGroup(): Promise<ServiceProviderAuthGroup> {
		const authGroups = (await this.userContext.getAuthGroups()).filter(
			(g) => g instanceof ServiceProviderAuthGroup,
		);

		return authGroups.length > 0 ? (authGroups[0] as ServiceProviderAuthGroup) : null;
	}

	/**
	 * Retrieves timeslots (available and booked) and accepted bookings for a service in a defined datetime range [startDate, endDate].
	 * Availability count returned may be zero.
	 * Pending and accepted bookings count towards availability quota.
	 * @param startDate The lower bound limit for timeslots' startDate.
	 * @param endDate The upper bound limit for timeslots' endDate.
	 * @param serviceId
	 * @param includeBookings (Optional)
	 * @param serviceProviderIds
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
		@Query() serviceProviderIds?: number[],
	): Promise<ApiData<TimeslotEntryResponse[]>> {
		let spIdsFilter = serviceProviderIds || [];
		const spGroup = await this.getServiceProviderAuthGroup();
		if (spGroup) {
			spIdsFilter =
				spIdsFilter.length === 0 ||
				// tslint:disable-next-line: tsr-detect-possible-timing-attacks
				spIdsFilter.some((id) => id === spGroup.authorisedServiceProvider.id)
					? [spGroup.authorisedServiceProvider.id]
					: [0];
		}

		const timeslots = await this.timeslotsService.getAggregatedTimeslots(
			startDate,
			endDate,
			serviceId,
			includeBookings,
			spIdsFilter,
		);
		const userContextSnapshot = await this.userContext.getSnapshot();
		return ApiDataFactory.create(timeslots?.map((t) => TimeslotsMapper.mapTimeslotEntry(t, userContextSnapshot)));
	}
}
