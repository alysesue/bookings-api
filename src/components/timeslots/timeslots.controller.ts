import { DateHelper } from '../../infrastructure/dateHelper';
import { Inject } from 'typescript-ioc';
import { Controller, Get, Header, Query, Response, Route, Security, Tags } from 'tsoa';
import { MOLAuth } from 'mol-lib-common';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { UserContext } from '../../infrastructure/auth/userContext';
import { ServiceProviderAuthGroup } from '../../infrastructure/auth/authGroup';
import { IdHasher } from '../../infrastructure/idHasher';
import { TimeslotsMapperV1, TimeslotsMapperV2 } from './timeslots.mapper';
import { TimeslotsService } from './timeslots.service';
import {
	AvailabilityByDayResponse,
	AvailabilityEntryResponseV1,
	AvailabilityEntryResponseV2,
	TimeslotEntryResponseV1,
	TimeslotEntryResponseV2,
} from './timeslots.apicontract';
import { StopWatch } from '../../infrastructure/stopWatch';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { LabelOperationFiltering } from '../labels/label.enum';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth';
import { BookingSGAuth } from '../../infrastructure/decorators/bookingSGAuth';

@Route('v1/timeslots')
@Tags('Timeslots')
export class TimeslotsController extends Controller {
	MAX_NUMBER_OF_DAYS_TO_FETCH_TIMESLOT = 31;

	@Inject
	private userContext: UserContext;

	@Inject
	private timeslotsService: TimeslotsService;

	@Inject
	private timeslotMapper: TimeslotsMapperV1;

	@Inject
	private idHasher: IdHasher;

	/**
	 * Retrieves available timeslots for a service in a defined datetime range [startDate, endDate].
	 * Availability count returned will be at least 1.
	 * Pending and accepted bookings count towards availability quota.
	 *
	 * @param startDate The lower bound limit for timeslots' startDate.
	 * @param endDate The upper bound limit for timeslots' endDate.
	 * @param @isInt serviceId The available service to be queried.
	 * @param @isInt serviceProviderId (Optional) Filters timeslots for a specific service provider.
	 * @param exactTimeslot (Optional) to filter timeslots for the given dates.
	 * @param labelIds (Optional) to filter by label
	 * @param labelTypeOfFiltering (Optional) type of filtering "union" or "intersection" (default: intersection)
	 */
	@Get('availability')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, anonymous: { requireOtp: false } })
	@Security('service')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous]')
	public async getAvailability(
		@Query() startDate: Date,
		@Query() endDate: Date,
		@Header('x-api-service') serviceId: number,
		@Query() serviceProviderId?: number,
		@Query() exactTimeslot = false,
		@Query() labelIds?: string[],
		@Query() labelOperationFiltering?: LabelOperationFiltering,
	): Promise<ApiData<AvailabilityEntryResponseV1[]>> {
		const labelIdsNumber = labelIds && labelIds.length > 0 ? labelIds.map((id) => this.idHasher.decode(id)) : [];

		let timeslots = await this.timeslotsService.getAggregatedTimeslots({
			startDateTime: startDate,
			endDateTime: endDate,
			serviceId,
			includeBookings: exactTimeslot,
			serviceProviderIds: serviceProviderId ? [serviceProviderId] : undefined,
			labelIds: labelIdsNumber,
			filterDaysInAdvance: true,
			labelOperationFiltering,
		});

		if (exactTimeslot) {
			timeslots = timeslots.filter(
				(timeslot) => timeslot.startTime === startDate.getTime() && timeslot.endTime === endDate.getTime(),
			);
		}

		const mappingWatch = new StopWatch('EntryResponse map');
		const result = this.timeslotMapper.mapAvailabilityToResponseV1(timeslots, {
			skipUnavailable: true,
			exactTimeslot,
		});
		mappingWatch.stop();

		return ApiDataFactory.create(result);
	}

	private async getServiceProviderAuthGroup(): Promise<ServiceProviderAuthGroup> {
		const authGroups = (await this.userContext.getAuthGroups()).filter(
			(g) => g instanceof ServiceProviderAuthGroup,
		);

		return authGroups.length > 0 ? (authGroups[0] as ServiceProviderAuthGroup) : null;
	}

	/**
	 * Retrieves availability of all service providers for a service, grouped by day
	 * Availability count returned may be zero.
	 * Pending and accepted bookings count towards availability quota.
	 *
	 * @param startDate The lower bound limit for timeslots' startDate.
	 * @param endDate The upper bound limit for timeslots' endDate. # of days between startDate and endDate cannot be more than 31 days
	 * @param serviceId
	 * @param serviceProviderIds
	 */
	@Get('byday')
	@Security('service')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getAvailabilityByDay(
		@Query() startDate: Date,
		@Query() endDate: Date,
		@Header('x-api-service') serviceId: number,
		@Query() serviceProviderIds?: number[],
	): Promise<ApiData<AvailabilityByDayResponse[]>> {
		if (DateHelper.DiffInDays(endDate, startDate) > this.MAX_NUMBER_OF_DAYS_TO_FETCH_TIMESLOT) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Date Range cannot be more than 31 days');
		}
		const timeslots = await this.timeslotsService.getAggregatedTimeslots({
			startDateTime: startDate,
			endDateTime: endDate,
			serviceId,
			includeBookings: false,
			serviceProviderIds,
			filterDaysInAdvance: false,
		});

		const result = this.timeslotMapper.groupAvailabilityByDateResponse(timeslots);

		return ApiDataFactory.create(result);
	}

	/**
	 * Retrieves timeslots (available and booked) and accepted bookings for a service in a defined datetime range [startDate, endDate].
	 * Availability count returned may be zero.
	 * Pending and accepted bookings count towards availability quota.
	 *
	 * @param startDate The lower bound limit for timeslots' startDate.
	 * @param endDate The upper bound limit for timeslots' endDate.
	 * @param serviceId
	 * @param includeBookings (Optional)
	 * @param serviceProviderIds
	 * @param labelIds (Optional) to filter by label
	 */

	@Get('')
	@Security('service')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getTimeslots(
		@Query() startDate: Date,
		@Query() endDate: Date,
		@Header('x-api-service') serviceId: number,
		@Query() includeBookings = false,
		@Query() serviceProviderIds?: number[],
		@Query() labelIds?: string[],
	): Promise<ApiData<TimeslotEntryResponseV1[]>> {
		const labelIdsNumber = labelIds && labelIds.length > 0 ? labelIds.map((id) => this.idHasher.decode(id)) : [];
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

		const timeslots = await this.timeslotsService.getAggregatedTimeslots({
			startDateTime: startDate,
			endDateTime: endDate,
			serviceId,
			includeBookings,
			serviceProviderIds: spIdsFilter,
			labelIds: labelIdsNumber,
			filterDaysInAdvance: false,
		});

		const mappedTimeslots = [];
		for (const timeslot of timeslots) {
			const mappedTimeslot = await this.timeslotMapper.mapTimeslotEntryV1(timeslot);
			mappedTimeslots.push(mappedTimeslot);
		}
		return ApiDataFactory.create(mappedTimeslots);
	}
}

@Route('v2/timeslots')
@Tags('Timeslots')
export class TimeslotsControllerV2 extends Controller {
	MAX_NUMBER_OF_DAYS_TO_FETCH_TIMESLOT = 31;

	@Inject
	private userContext: UserContext;

	@Inject
	private timeslotsService: TimeslotsService;

	@Inject
	private timeslotMapper1: TimeslotsMapperV1;

	@Inject
	private timeslotMapper: TimeslotsMapperV2;

	@Inject
	private idHasher: IdHasher;

	/**
	 * Retrieves available timeslots for a service in a defined datetime range [startDate, endDate].
	 * Availability count returned will be at least 1.
	 * Pending and accepted bookings count towards availability quota.
	 *
	 * @param startDate The lower bound limit for timeslots' startDate.
	 * @param endDate The upper bound limit for timeslots' endDate.
	 * @param serviceId The available service to be queried.
	 * @param serviceProviderId (Optional) Filters timeslots for a specific service provider.
	 * @param exactTimeslot (Optional) to filter timeslots for the given dates.
	 * @param labelIds (Optional) to filter by label
	 */
	@Get('availability')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, anonymous: { requireOtp: false } })
	@Security('service')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous]')
	public async getAvailability(
		@Query() startDate: Date,
		@Query() endDate: Date,
		@Header('x-api-service') serviceId: string,
		@Query() serviceProviderId?: string,
		@Query() exactTimeslot = false,
		@Query() labelIds?: string[],
	): Promise<ApiData<AvailabilityEntryResponseV2[]>> {
		const labelIdsNumber = labelIds && labelIds.length > 0 ? labelIds.map((id) => this.idHasher.decode(id)) : [];

		const unsignedServiceId = this.idHasher.decode(serviceId);
		const unsignedServiceProviderId = this.idHasher.decode(serviceProviderId);

		let timeslots = await this.timeslotsService.getAggregatedTimeslots({
			startDateTime: startDate,
			endDateTime: endDate,
			serviceId: unsignedServiceId,
			includeBookings: exactTimeslot,
			serviceProviderIds: unsignedServiceProviderId ? [unsignedServiceProviderId] : undefined,
			labelIds: labelIdsNumber,
			filterDaysInAdvance: true,
		});

		if (exactTimeslot) {
			timeslots = timeslots.filter(
				(timeslot) => timeslot.startTime === startDate.getTime() && timeslot.endTime === endDate.getTime(),
			);
		}

		const mappingWatch = new StopWatch('EntryResponse map');
		const result = this.timeslotMapper.mapAvailabilityToResponseV2(timeslots, {
			skipUnavailable: true,
			exactTimeslot,
		});
		mappingWatch.stop();

		return ApiDataFactory.create(result);
	}

	private async getServiceProviderAuthGroup(): Promise<ServiceProviderAuthGroup> {
		const authGroups = (await this.userContext.getAuthGroups()).filter(
			(g) => g instanceof ServiceProviderAuthGroup,
		);

		return authGroups.length > 0 ? (authGroups[0] as ServiceProviderAuthGroup) : null;
	}

	/**
	 * Retrieves availability of all service providers for a service, grouped by day
	 * Availability count returned may be zero.
	 * Pending and accepted bookings count towards availability quota.
	 *
	 * @param startDate The lower bound limit for timeslots' startDate.
	 * @param endDate The upper bound limit for timeslots' endDate. # of days between startDate and endDate cannot be more than 31 days
	 * @param serviceId
	 * @param serviceProviderIds
	 */
	@Get('byday')
	@Security('service')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getAvailabilityByDay(
		@Query() startDate: Date,
		@Query() endDate: Date,
		@Header('x-api-service') serviceId: string,
		@Query() serviceProviderIds: string[] = [],
	): Promise<ApiData<AvailabilityByDayResponse[]>> {
		if (DateHelper.DiffInDays(endDate, startDate) > this.MAX_NUMBER_OF_DAYS_TO_FETCH_TIMESLOT) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Date Range cannot be more than 31 days');
		}

		const unsignedServiceId = this.idHasher.decode(serviceId);
		const unsignedServiceProviderIds: number[] = [];
		for (const spId of serviceProviderIds) {
			const unsignedSpId = this.idHasher.decode(spId);
			unsignedServiceProviderIds.push(unsignedSpId);
		}

		const timeslots = await this.timeslotsService.getAggregatedTimeslots({
			startDateTime: startDate,
			endDateTime: endDate,
			serviceId: unsignedServiceId,
			includeBookings: false,
			serviceProviderIds: unsignedServiceProviderIds,
			filterDaysInAdvance: false,
		});

		const result = this.timeslotMapper1.groupAvailabilityByDateResponse(timeslots);

		return ApiDataFactory.create(result);
	}

	/**
	 * Retrieves timeslots (available and booked) and accepted bookings for a service in a defined datetime range [startDate, endDate].
	 * Availability count returned may be zero.
	 * Pending and accepted bookings count towards availability quota.
	 *
	 * @param startDate The lower bound limit for timeslots' startDate.
	 * @param endDate The upper bound limit for timeslots' endDate.
	 * @param serviceId
	 * @param includeBookings (Optional)
	 * @param serviceProviderIds
	 * @param labelIds (Optional) to filter by label
	 */

	@Get('')
	@Security('service')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getTimeslots(
		@Query() startDate: Date,
		@Query() endDate: Date,
		@Header('x-api-service') serviceId: string,
		@Query() includeBookings = false,
		@Query() serviceProviderIds: string[] = [],
		@Query() labelIds?: string[],
	): Promise<ApiData<TimeslotEntryResponseV2[]>> {
		const labelIdsNumber = labelIds && labelIds.length > 0 ? labelIds.map((id) => this.idHasher.decode(id)) : [];

		const unsignedServiceId = this.idHasher.decode(serviceId);
		const unsignedServiceProviderIds: number[] = [];
		for (const spId of serviceProviderIds) {
			const unsignedSpId = this.idHasher.decode(spId);
			unsignedServiceProviderIds.push(unsignedSpId);
		}

		let spIdsFilter = unsignedServiceProviderIds || [];
		const spGroup = await this.getServiceProviderAuthGroup();
		if (spGroup) {
			spIdsFilter =
				spIdsFilter.length === 0 ||
				// tslint:disable-next-line: tsr-detect-possible-timing-attacks
				spIdsFilter.some((id) => id === spGroup.authorisedServiceProvider.id)
					? [spGroup.authorisedServiceProvider.id]
					: [0];
		}

		const timeslots = await this.timeslotsService.getAggregatedTimeslots({
			startDateTime: startDate,
			endDateTime: endDate,
			serviceId: unsignedServiceId,
			includeBookings,
			serviceProviderIds: spIdsFilter,
			labelIds: labelIdsNumber,
			filterDaysInAdvance: false,
		});

		const mappedTimeslots = [];
		for (const timeslot of timeslots) {
			const mappedTimeslot = await this.timeslotMapper.mapTimeslotEntryV2(timeslot);
			mappedTimeslots.push(mappedTimeslot);
		}
		return ApiDataFactory.create(mappedTimeslots);
	}
}
