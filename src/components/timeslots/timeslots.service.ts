import { Inject, Scope, Scoped } from 'typescript-ioc';
import { Booking, BookingStatus, ServiceProvider, TimeOfDay, TimeslotItem } from '../../models';
import { BookingsRepository } from '../bookings/bookings.repository';
import { groupByKey } from '../../tools/collections';
import { ServicesRepository } from '../services/services.repository';
import { ServiceProvidersRepository } from '../serviceProviders/serviceProviders.repository';
import { UnavailabilitiesService } from '../unavailabilities/unavailabilities.service';
import { TimeslotWithCapacity } from '../../models/timeslotWithCapacity';
import { TimeslotServiceProviderResult } from '../../models/timeslotServiceProvider';
import { StopWatch } from '../../infrastructure/stopWatch';
import { nextImmediateTick } from '../../infrastructure/immediateHelper';
import { MAX_PAGING_LIMIT } from '../../core/pagedEntities';
import { DateHelper } from '../../infrastructure/dateHelper';
import { Weekday } from '../../enums/weekday';
import { intersectsDateTimeNative } from '../../tools/timeSpan';
import { MapProcessor } from './mapProcessor';
import { AvailableTimeslotProviders } from './availableTimeslotProviders';
import { generateTimeslotKey, generateTimeslotKeyNative, TimeslotKey, TimeslotMap } from './timeslotAggregator';
import { TimeslotsScheduleRepository } from '../timeslotsSchedules/timeslotsSchedule.repository';
import { AggregatorTimeslotProviders, ServiceProvidersLookup } from './aggregatorTimeslotProviders';
import { TimeslotGenerator } from '../../models/timeslotGenerator';
import { RequestClock } from '../../infrastructure/requestClock';
import { EventsRepository } from '../events/events.repository';
import { TimeslotsMapperV2 } from './timeslots.mapper';
import { LabelOperationFiltering } from '../labels/label.enum';

export class AvailableTimeslotProcessor extends MapProcessor<TimeslotKey, AvailableTimeslotProviders> {}

@Scoped(Scope.Request)
export class TimeslotsService {
	@Inject
	private bookingsRepository: BookingsRepository;

	@Inject
	private eventsRepository: EventsRepository;

	@Inject
	private servicesRepository: ServicesRepository;
	@Inject
	private serviceProvidersRepo: ServiceProvidersRepository;
	@Inject
	private unavailabilitiesService: UnavailabilitiesService;
	@Inject
	private timeslotsScheduleRepository: TimeslotsScheduleRepository;
	@Inject
	private requestClock: RequestClock;
	@Inject
	private timeslotsMapperV2: TimeslotsMapperV2;

	private static timeslotKeySelector = (startNative: number, endNative: number): TimeslotKey =>
		generateTimeslotKeyNative(startNative, endNative);
	private static bookingKeySelector = (booking: Booking): TimeslotKey =>
		generateTimeslotKey(booking.startDateTime, booking.endDateTime);

	private static mergeAcceptedBookingsToTimeslots(
		serviceProviderLookup: ServiceProvidersLookup,
		aggregatedEntries: TimeslotMap<AvailableTimeslotProviders>,
		acceptedBookings: Booking[],
	): void {
		for (const booking of acceptedBookings) {
			if (!booking.serviceProvider) {
				continue;
			}

			const timeslotKey = TimeslotsService.bookingKeySelector(booking);
			let aggregatedEntry = aggregatedEntries.get(timeslotKey);

			if (!aggregatedEntry) {
				aggregatedEntry = AvailableTimeslotProviders.empty(
					serviceProviderLookup,
					booking.startDateTime.getTime(),
					booking.endDateTime.getTime(),
				);
				aggregatedEntries.set(timeslotKey, aggregatedEntry);
			}

			if (!aggregatedEntry.hasServiceProviderId(booking.serviceProvider.id)) {
				const timeslotForBooking = {
					startTimeNative: booking.startDateTime.getTime(),
					endTimeNative: booking.endDateTime.getTime(),
					capacity: 0,
				} as TimeslotWithCapacity;

				aggregatedEntry.addServiceProvider(booking.serviceProvider, timeslotForBooking);
			}
		}
	}

	public async isProviderAvailableForTimeslot(params: {
		startDateTime: Date;
		endDateTime: Date;
		serviceId: number;
		serviceProviderId: number;
		skipUnassigned: boolean;
		filterDaysInAdvance: boolean;
	}): Promise<boolean> {
		const providers = await this.getAvailableProvidersForTimeslot({
			...params,
			serviceProviderId: params.serviceProviderId,
		});

		return providers.length > 0;
	}

	public async getAvailableProvidersForTimeslot(params: {
		startDateTime: Date;
		endDateTime: Date;
		serviceId: number;
		skipUnassigned: boolean;
		filterDaysInAdvance: boolean;
		serviceProviderId?: number;
	}): Promise<TimeslotServiceProviderResult[]> {
		const { startDateTime, endDateTime, serviceId, filterDaysInAdvance, serviceProviderId } = params;

		const aggregatedEntries = await this.getAggregatedTimeslots({
			startDateTime,
			endDateTime,
			serviceId,
			includeBookings: false,
			serviceProviderIds: serviceProviderId ? [serviceProviderId] : undefined,
			filterDaysInAdvance,
		});

		const timeslotEntry = aggregatedEntries.find(
			(e) => e.startTime === startDateTime.getTime() && e.endTime === endDateTime.getTime(),
		);
		let availableProviders = Array.from(
			timeslotEntry?.getTimeslotServiceProviders(params.skipUnassigned) || [],
		).filter((e) => e.availabilityCount > 0);
		if (serviceProviderId) {
			availableProviders = availableProviders.filter((e) => e.serviceProvider.id === serviceProviderId);
		}
		return availableProviders;
	}

	private static setPendingTimeslots(pendingBookings: Booking[]): AvailableTimeslotProcessor {
		const pendingBookingsLookup = groupByKey(pendingBookings, TimeslotsService.bookingKeySelector);

		return new AvailableTimeslotProcessor(([_key, element]) => {
			const elementKey = TimeslotsService.timeslotKeySelector(element.startTime, element.endTime);
			const elementPendingBookings = pendingBookingsLookup.get(elementKey);
			if (elementPendingBookings) {
				element.addPendingBookings(elementPendingBookings);
			}
		});
	}

	private setOnHoldTimeslots(onHoldBookings: Booking[]): AvailableTimeslotProcessor {
		const onHoldBookingsLookup = groupByKey(onHoldBookings, TimeslotsService.bookingKeySelector);

		return new AvailableTimeslotProcessor(([_key, element]) => {
			const elementKey = TimeslotsService.timeslotKeySelector(element.startTime, element.endTime);
			const elementOnHoldBookings = onHoldBookingsLookup.get(elementKey);
			if (elementOnHoldBookings) {
				element.addPendingBookings(elementOnHoldBookings);
			}
		});
	}

	public async getAggregatedTimeslots(params: {
		startDateTime: Date;
		endDateTime: Date;
		serviceId: number;
		filterDaysInAdvance: boolean;
		includeBookings?: boolean;
		serviceProviderIds?: number[];
		labelIds?: number[];
		labelOperationFiltering?: LabelOperationFiltering;
	}): Promise<AvailableTimeslotProviders[]> {
		const {
			serviceId,
			includeBookings,
			serviceProviderIds,
			labelIds,
			filterDaysInAdvance,
			labelOperationFiltering,
		} = params;
		let range = {
			start: params.startDateTime,
			end: params.endDateTime,
		};

		if (filterDaysInAdvance) {
			const service = await this.servicesRepository.getService({ id: serviceId });
			if (!service) {
				return [];
			}
			const now = this.requestClock.requestTime();
			range = service.filterDaysInAdvance({ now, ...range });
		}

		return this.getAggregatedTimeslotsInternal(
			range.start,
			range.end,
			serviceId,
			includeBookings || false,
			serviceProviderIds,
			labelIds,
			labelOperationFiltering,
		);
	}

	private async getAggregatedTimeslotsInternal(
		startDateTime: Date,
		endDateTime: Date,
		serviceId: number,
		includeBookings: boolean,
		serviceProviderIds?: number[],
		labelIds?: number[],
		labelOperationFiltering?: LabelOperationFiltering,
	): Promise<AvailableTimeslotProviders[]> {
		if (endDateTime < startDateTime) {
			return [];
		}

		const getAggregatedTimeslotEntriesWatch = new StopWatch('getAggregatedTimeslotEntries');
		const [serviceProviderLookup, aggregatedEntries] = await this.generateTimeslotEntries(
			startDateTime,
			endDateTime,
			serviceId,
			serviceProviderIds,
			labelIds,
			labelOperationFiltering,
		);
		getAggregatedTimeslotEntriesWatch.stop();

		const bookings = (
			await this.bookingsRepository.search({
				from: startDateTime,
				to: endDateTime,
				statuses: [BookingStatus.PendingApproval, BookingStatus.Accepted, BookingStatus.OnHold],
				serviceId,
				byPassAuth: true,
				page: 1,
				limit: MAX_PAGING_LIMIT,
			})
		).entries;

		const acceptedBookings = bookings.filter((booking) => booking.status === BookingStatus.Accepted);
		const pendingBookings = bookings.filter((booking) => booking.status === BookingStatus.PendingApproval);
		const onHoldBookings = bookings.filter((booking) => {
			const onHoldUntil = booking.onHoldUntil;
			return booking.status === BookingStatus.OnHold && this.requestClock.requestTime() < onHoldUntil;
		});
		if (includeBookings) {
			TimeslotsService.mergeAcceptedBookingsToTimeslots(
				serviceProviderLookup,
				aggregatedEntries,
				acceptedBookings,
			);
		}

		if (serviceProviderIds && serviceProviderIds.length > 0) {
			for (const [key, value] of aggregatedEntries) {
				if (!serviceProviderIds.some((spId) => value.hasServiceProviderId(spId))) {
					aggregatedEntries.delete(key);
				}
			}
		}

		const mapProcessors: AvailableTimeslotProcessor[] = [
			await this.filterUnavailabilities(startDateTime, endDateTime, serviceId),
			this.setBookedProviders(acceptedBookings),
			TimeslotsService.setPendingTimeslots(pendingBookings),
			this.setOnHoldTimeslots(onHoldBookings),
			await this.filterVisibleServiceProviders({ entries: aggregatedEntries, serviceId, serviceProviderIds }),
		];

		const mapProcessorsWatch = new StopWatch('MapProcessor');
		const combinedProcessors = AvailableTimeslotProcessor.combine(...mapProcessors);
		await combinedProcessors.process(aggregatedEntries);
		mapProcessorsWatch.stop();

		const result = Array.from(aggregatedEntries.values());
		result.sort(TimeslotsService.sortAvailableTimeslotProviders);
		return result;
	}

	private async filterVisibleServiceProviders({
		entries,
		serviceId,
		serviceProviderIds,
	}: {
		entries: TimeslotMap<AvailableTimeslotProviders>;
		serviceId: number;
		serviceProviderIds?: number[];
	}): Promise<AvailableTimeslotProcessor> {
		const serviceProviders = await this.serviceProvidersRepo.getServiceProviders({
			serviceId,
			skipGroupMap: true,
			skipService: true,
		});
		let visibleServiceProviderIds = serviceProviders.map((sp) => sp.id);

		if (serviceProviderIds && serviceProviderIds.length > 0) {
			const serviceProviderIdsSet = new Set(serviceProviderIds);
			visibleServiceProviderIds = visibleServiceProviderIds.filter((id) => serviceProviderIdsSet.has(id));
		}

		return new AvailableTimeslotProcessor(([key, entry]) => {
			entry.setVisibleServiceProviders(visibleServiceProviderIds);

			if (!entry.isValidAndVisible()) {
				entries.delete(key);
			}
		});
	}

	private static sortAvailableTimeslotProviders(a: AvailableTimeslotProviders, b: AvailableTimeslotProviders) {
		const checkStartTime = a.startTime - b.startTime;
		return checkStartTime === 0 ? a.endTime - b.endTime : checkStartTime;
	}

	private async filterUnavailabilities(
		startDateTime: Date,
		endDateTime: Date,
		serviceId: number,
	): Promise<AvailableTimeslotProcessor> {
		const unavailabilities = await this.unavailabilitiesService.search({
			from: startDateTime,
			to: endDateTime,
			serviceId,
			skipAuthorisation: true,
		});

		return new AvailableTimeslotProcessor(([_key, entry]) => {
			for (const unavailability of unavailabilities) {
				if (unavailability.intersectsNative(entry.startTime, entry.endTime)) {
					entry.setUnavailability(unavailability);
				}
			}
		});
	}

	private setBookedProviders(acceptedBookings: Booking[]): AvailableTimeslotProcessor {
		const acceptedBookingsLookup = groupByKey(acceptedBookings, TimeslotsService.bookingKeySelector);

		return new AvailableTimeslotProcessor(([_key, element]) => {
			const overlappingSps = acceptedBookings
				.filter((booking) => {
					if (
						booking.startDateTime.getTime() === element.startTime &&
						booking.endDateTime.getTime() === element.endTime
					) {
						return false; // Don't count bookings that overlap exactly
					}
					return booking.bookingIntersectsNative(element.startTime, element.endTime);
				})
				.map((booking) => booking.serviceProviderId);
			element.setOverlappingServiceProviders(overlappingSps);

			const elementKey = TimeslotsService.timeslotKeySelector(element.startTime, element.endTime);
			const acceptedBookingsForTimeslot = acceptedBookingsLookup.get(elementKey);
			if (acceptedBookingsForTimeslot) {
				element.setBookedServiceProviders(acceptedBookingsForTimeslot);
			}
		});
	}

	public createTimeslotScheduleOptions(
		minStartTime: Date,
		maxEndTime: Date,
	): {
		weekDays?: Weekday[];
		startTime?: TimeOfDay;
		endTime?: TimeOfDay;
	} {
		const weekDays = DateHelper.getWeekDaysInRange(minStartTime, maxEndTime);
		if (weekDays.length === 1) {
			return {
				weekDays,
				startTime: TimeOfDay.fromDate(minStartTime),
				endTime: TimeOfDay.fromDate(maxEndTime),
			};
		} else if (weekDays.length > 1 && weekDays.length < 7) {
			return { weekDays };
		} else {
			return {};
		}
	}

	private *filterTimeslotsOverrides(
		timeslots: Iterable<TimeslotWithCapacity>,
		overrides: TimeslotWithCapacity[],
	): Iterable<TimeslotWithCapacity> {
		for (const timeslot of timeslots) {
			const intersectsAny = overrides.some((override) =>
				intersectsDateTimeNative(
					timeslot.startTimeNative,
					timeslot.endTimeNative,
					override.startTimeNative,
					override.endTimeNative,
				),
			);

			if (!intersectsAny) yield timeslot;
		}
	}

	private async generateTimeslotEntries(
		minStartTime: Date,
		maxEndTime: Date,
		serviceId: number,
		serviceProviderIds?: number[],
		labelIds?: number[],
		labelOperationFiltering?: LabelOperationFiltering,
	): Promise<[ServiceProvidersLookup, TimeslotMap<AvailableTimeslotProviders>]> {
		const serviceProviderLookup = new ServiceProvidersLookup();
		const aggregator = new AggregatorTimeslotProviders(serviceProviderLookup);
		const hasLabelFilter = labelIds && labelIds.length > 0;

		const service = await this.servicesRepository.getServiceWithTimeslotsSchedule(serviceId);
		if (!service) {
			return [serviceProviderLookup, aggregator.getEntries()];
		}

		const serviceProviders = await this.serviceProvidersRepo.getServiceProviders({
			ids: serviceProviderIds,
			serviceId,
			includeTimeslotsSchedule: false,
			skipAuthorisation: true, // loads all SPs regardless of user role
			skipGroupMap: true,
			skipService: true,
		});
		serviceProviderLookup.addMany(serviceProviders);

		const events = await this.eventsRepository.searchReturnAll({
			serviceId,
			serviceProviderIds,
			startDateTime: minStartTime,
			endDateTime: maxEndTime,
			byPassAuth: true,
			labelIds,
			isOneOffTimeslot: true,
			labelOperationFiltering,
		});
		const oneOffTimeslots = events.map<TimeslotWithCapacity>((e) =>
			this.timeslotsMapperV2.mapEventWithOneTimeslotToTimeslotWithCapacity(e),
		);

		const oneOffTimeslotsLookup = groupByKey(oneOffTimeslots, (e) => e.serviceProviderId);

		const range = {
			startDatetime: minStartTime,
			endDatetime: maxEndTime,
		};

		const processor = async (provider: ServiceProvider, timeslotItems: TimeslotItem[]) => {
			let timeslotsSP = new TimeslotGenerator(timeslotItems).generateValidTimeslots(range);

			const oneOffTimeslotsSP = oneOffTimeslotsLookup.get(provider.id);
			if (oneOffTimeslotsSP && oneOffTimeslotsSP.length > 0) {
				timeslotsSP = this.filterTimeslotsOverrides(timeslotsSP, oneOffTimeslotsSP);
				await aggregator.aggregate(provider, oneOffTimeslotsSP);
			}

			await aggregator.aggregate(provider, timeslotsSP);
			await nextImmediateTick();
		};

		if (hasLabelFilter) {
			// TimeslotItem (recurrent) has no labels, so skipping it.
			for (const provider of serviceProviders) {
				await processor(provider, []);
			}

			return [serviceProviderLookup, aggregator.getEntries()];
		}

		/* Stores TimeslotItem array for only 1 service provider at a time in memory. */
		const timeslotsForServiceProviders = await this.timeslotsScheduleRepository.getTimeslotsForServiceProviders({
			serviceId,
			providerIds: serviceProviderIds,
			...this.createTimeslotScheduleOptions(minStartTime, maxEndTime),
		});

		const processedSpIds = new Set<number>();
		for await (const [spId, timeslotItems] of timeslotsForServiceProviders.getRecords()) {
			const provider = serviceProviderLookup.get(spId);
			if (!provider) {
				continue;
			}

			await processor(provider, timeslotItems);
			processedSpIds.add(spId);
		}

		const spNoSchedule = serviceProviders.filter((sp) => !processedSpIds.has(sp.id));
		const serviceTimeslots = service.timeslotsSchedule?.timeslotItems || [];
		for (const provider of spNoSchedule) {
			await processor(provider, serviceTimeslots);
		}

		return [serviceProviderLookup, aggregator.getEntries()];
	}
}
