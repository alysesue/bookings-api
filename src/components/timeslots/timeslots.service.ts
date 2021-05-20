import { Inject, Scope, Scoped } from 'typescript-ioc';
import { Booking, BookingStatus, ServiceProvider, TimeOfDay, Timeslot } from '../../models';
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
import { OneOffTimeslotsRepository } from '../oneOffTimeslots/oneOffTimeslots.repository';
import { intersectsDateTimeNative } from '../../tools/timeSpan';
import { MapProcessor } from './mapProcessor';
import { AvailableTimeslotProviders } from './availableTimeslotProviders';
import {
	AggregatedEntryId,
	generateTimeslotKey,
	generateTimeslotKeyNative,
	TimeslotAggregator,
	TimeslotKey,
	TimeslotMap,
} from './timeslotAggregator';

export class AvailableTimeslotProcessor extends MapProcessor<TimeslotKey, AvailableTimeslotProviders> {}

const MaxLoopIterationCount = 1000;
@Scoped(Scope.Request)
export class TimeslotsService {
	@Inject
	private bookingsRepository: BookingsRepository;

	@Inject
	private servicesRepository: ServicesRepository;

	@Inject
	private serviceProvidersRepo: ServiceProvidersRepository;

	@Inject
	private unavailabilitiesService: UnavailabilitiesService;

	@Inject
	private oneOffTimeslotsRepository: OneOffTimeslotsRepository;

	private static timeslotKeySelector = (startNative: number, endNative: number): TimeslotKey =>
		generateTimeslotKeyNative(startNative, endNative);
	private static bookingKeySelector = (booking: Booking): TimeslotKey =>
		generateTimeslotKey(booking.startDateTime, booking.endDateTime);

	private static async mapServiceProviderAggregatedEntriesToTimeslots(
		entries: TimeslotMap<AggregatedEntryId<ServiceProvider>>,
	): Promise<TimeslotMap<AvailableTimeslotProviders>> {
		let counter = 0;
		const result = new TimeslotMap<AvailableTimeslotProviders>();
		for (const [key, entry] of entries) {
			const mapped = AvailableTimeslotProviders.create(entry);
			result.set(key, mapped);
			if (counter++ > MaxLoopIterationCount) {
				counter = 0;
				await nextImmediateTick();
			}
		}
		return result;
	}

	private static mergeAcceptedBookingsToTimeslots(
		aggregatedEntries: TimeslotMap<AggregatedEntryId<ServiceProvider>>,
		acceptedBookings: Booking[],
	): void {
		for (const booking of acceptedBookings) {
			if (!booking.serviceProvider) {
				continue;
			}

			const timeslotKey = TimeslotsService.bookingKeySelector(booking);
			let aggregatedEntry = aggregatedEntries.get(timeslotKey);

			if (!aggregatedEntry) {
				const timeslot = {
					startTimeNative: booking.startDateTime.getTime(),
					endTimeNative: booking.endDateTime.getTime(),
				} as Timeslot;

				aggregatedEntry = new AggregatedEntryId<ServiceProvider>(timeslot);
				aggregatedEntries.set(timeslotKey, aggregatedEntry);
			}

			if (!aggregatedEntry.hasGroupId(booking.serviceProvider.id)) {
				const timeslotForBooking = {
					startTimeNative: booking.startDateTime.getTime(),
					endTimeNative: booking.endDateTime.getTime(),
					capacity: 0,
				} as TimeslotWithCapacity;

				aggregatedEntry.addGroup(booking.serviceProvider, timeslotForBooking);
			}
		}
	}

	public async isProviderAvailableForTimeslot(
		startDateTime: Date,
		endDateTime: Date,
		serviceId: number,
		serviceProviderId: number,
		skipUnassigned: boolean,
	): Promise<boolean> {
		const providers = await this.getAvailableProvidersForTimeslot(
			startDateTime,
			endDateTime,
			serviceId,
			skipUnassigned,
			serviceProviderId,
		);
		const isProviderAvailable = providers.some((item) => item.serviceProvider.id === serviceProviderId);
		return isProviderAvailable;
	}

	public async getAvailableProvidersForTimeslot(
		startDateTime: Date,
		endDateTime: Date,
		serviceId: number,
		skipUnassigned: boolean,
		serviceProviderId?: number,
	): Promise<TimeslotServiceProviderResult[]> {
		const aggregatedEntries = await this.getAggregatedTimeslots(
			startDateTime,
			endDateTime,
			serviceId,
			false,
			serviceProviderId ? [serviceProviderId] : undefined,
		);

		const timeslotEntry = aggregatedEntries.find(
			(e) => e.startTime === startDateTime.getTime() && e.endTime === endDateTime.getTime(),
		);
		let availableProviders = Array.from(timeslotEntry?.getTimeslotServiceProviders(skipUnassigned) || []).filter(
			(e) => e.availabilityCount > 0,
		);
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
				element.setPendingBookings(elementPendingBookings);
			}
		});
	}

	private setOnHoldTimeslots(onHoldBookings: Booking[]): AvailableTimeslotProcessor {
		const onHoldBookingsLookup = groupByKey(onHoldBookings, TimeslotsService.bookingKeySelector);

		return new AvailableTimeslotProcessor(([_key, element]) => {
			const elementKey = TimeslotsService.timeslotKeySelector(element.startTime, element.endTime);
			const elementOnHoldBookings = onHoldBookingsLookup.get(elementKey);
			if (elementOnHoldBookings) {
				element.setPendingBookings(elementOnHoldBookings);
			}
		});
	}

	public async getAggregatedTimeslots(
		startDateTime: Date,
		endDateTime: Date,
		serviceId: number,
		includeBookings = false,
		serviceProviderIds?: number[],
		labelIds?: number[],
	): Promise<AvailableTimeslotProviders[]> {
		const getAggregatedTimeslotEntriesWatch = new StopWatch('getAggregatedTimeslotEntries');
		const aggregatedEntries = await this.getAggregatedTimeslotEntries(
			startDateTime,
			endDateTime,
			serviceId,
			serviceProviderIds,
			labelIds,
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
			return booking.status === BookingStatus.OnHold && new Date() < onHoldUntil;
		});
		if (includeBookings) {
			TimeslotsService.mergeAcceptedBookingsToTimeslots(aggregatedEntries, acceptedBookings);
		}

		if (serviceProviderIds && serviceProviderIds.length > 0) {
			for (const [key, value] of aggregatedEntries) {
				if (!serviceProviderIds.some((spId) => value.hasGroupId(spId))) {
					aggregatedEntries.delete(key);
				}
			}
		}

		const mappingWatch = new StopWatch('mappingWatch');
		const mappedEntries = await TimeslotsService.mapServiceProviderAggregatedEntriesToTimeslots(aggregatedEntries);
		mappingWatch.stop();

		const mapProcessors: AvailableTimeslotProcessor[] = [
			await this.filterUnavailabilities(startDateTime, endDateTime, serviceId),
			this.setBookedProviders(acceptedBookings),
			TimeslotsService.setPendingTimeslots(pendingBookings),
			this.setOnHoldTimeslots(onHoldBookings),
			await this.filterVisibleServiceProviders({ entries: mappedEntries, serviceId, serviceProviderIds }),
		];

		const mapProcessorsWatch = new StopWatch('MapProcessor');
		const combinedProcessors = AvailableTimeslotProcessor.combine(...mapProcessors);
		await combinedProcessors.process(mappedEntries);
		mapProcessorsWatch.stop();

		const result = Array.from(mappedEntries.values());
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
		const serviceProviders = await this.serviceProvidersRepo.getServiceProviders({ serviceId });
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
			const result = acceptedBookings
				.filter((booking) => {
					return booking.bookingIntersectsNative(element.startTime, element.endTime);
				})
				.map((booking) => booking.serviceProviderId);
			element.setOverlappingServiceProviders(result);

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

	private async getAggregatedTimeslotEntries(
		minStartTime: Date,
		maxEndTime: Date,
		serviceId: number,
		serviceProviderIds?: number[],
		labelIds?: number[],
	): Promise<TimeslotMap<AggregatedEntryId<ServiceProvider>>> {
		const aggregator = TimeslotAggregator.createCustom<ServiceProvider, AggregatedEntryId<ServiceProvider>>(
			AggregatedEntryId,
		);
		const hasLabelFilter = labelIds && labelIds.length > 0;

		const service = await this.servicesRepository.getServiceWithTimeslotsSchedule(serviceId);
		if (!service) {
			return aggregator.getEntries();
		}

		const serviceProviders = await this.serviceProvidersRepo.getServiceProviders({
			ids: serviceProviderIds,
			serviceId,
			includeTimeslotsSchedule: !hasLabelFilter,
			timeslotsScheduleOptions: this.createTimeslotScheduleOptions(minStartTime, maxEndTime),
			skipAuthorisation: true, // loads all SPs regardless of user role
		});

		const oneOffTimeslots = await this.oneOffTimeslotsRepository.search({
			serviceId,
			serviceProviderIds,
			startDateTime: minStartTime,
			endDateTime: maxEndTime,
			byPassAuth: true,
			labelIds,
		});

		const oneOffTimeslotsLookup = groupByKey(oneOffTimeslots, (e) => e.serviceProviderId);

		let validServiceTimeslots = [];
		if (!hasLabelFilter) {
			validServiceTimeslots = Array.from(
				service.timeslotsSchedule?.generateValidTimeslots({
					startDatetime: minStartTime,
					endDatetime: maxEndTime,
				}) || [],
			);
		}

		for (const provider of serviceProviders) {
			const oneOffTimeslotsSP = oneOffTimeslotsLookup.get(provider.id);

			const timeslotsSP = provider.timeslotsSchedule
				? provider.timeslotsSchedule.generateValidTimeslots({
						startDatetime: minStartTime,
						endDatetime: maxEndTime,
				  })
				: validServiceTimeslots;

			if (oneOffTimeslotsSP && oneOffTimeslotsSP.length > 0) {
				const filteredTimeslots = this.filterTimeslotsOverrides(timeslotsSP, oneOffTimeslotsSP);
				await aggregator.aggregate(provider, oneOffTimeslotsSP);
				await aggregator.aggregate(provider, filteredTimeslots);
			} else {
				await aggregator.aggregate(provider, timeslotsSP);
			}

			await nextImmediateTick();
		}

		return aggregator.getEntries();
	}
}
