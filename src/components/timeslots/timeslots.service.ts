import { Inject, Scope, Scoped } from 'typescript-ioc';
import { AggregatedEntryId, generateTimeslotKey, TimeslotAggregator, TimeslotKey } from './timeslotAggregator';
import { Booking, BookingStatus, ServiceProvider, Timeslot } from '../../models';
import { DateHelper } from '../../infrastructure/dateHelper';
import { BookingsRepository } from '../bookings/bookings.repository';
import { groupByKey } from '../../tools/collections';
import { ServicesRepository } from '../services/services.repository';
import { ServiceProvidersRepository } from '../serviceProviders/serviceProviders.repository';
import { AvailableTimeslotProviders } from './availableTimeslotProviders';
import { UnavailabilitiesService } from '../unavailabilities/unavailabilities.service';
import { TimeslotWithCapacity } from '../../models/timeslotWithCapacity';
import { TimeslotServiceProviderResult } from '../../models/timeslotServiceProvider';
import { MapProcessor } from './mapProcessor';
import { StopWatch } from '../../infrastructure/stopWatch';
import { nextImmediateTick } from '../../infrastructure/immediateHelper';

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

	private static timeslotKeySelector = (start: Date, end: Date): TimeslotKey => generateTimeslotKey(start, end);
	private static bookingKeySelector = (booking: Booking): TimeslotKey =>
		generateTimeslotKey(booking.startDateTime, booking.endDateTime);

	private static async mapServiceProviderAggregatedEntriesToTimeslots(
		entries: Map<TimeslotKey, AggregatedEntryId<ServiceProvider>>,
	): Promise<Map<TimeslotKey, AvailableTimeslotProviders>> {
		let counter = 0;
		const result = new Map<TimeslotKey, AvailableTimeslotProviders>();
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
		aggregatedEntries: Map<TimeslotKey, AggregatedEntryId<ServiceProvider>>,
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
					startTime: booking.startDateTime,
					endTime: booking.endDateTime,
				} as Timeslot;

				aggregatedEntry = new AggregatedEntryId<ServiceProvider>(timeslot);
				aggregatedEntries.set(timeslotKey, aggregatedEntry);
			}

			if (!aggregatedEntry.hasGroupId(booking.serviceProvider.id)) {
				const timeslotForBooking = {
					startTime: booking.startDateTime,
					endTime: booking.endDateTime,
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
			serviceProviderId,
		);

		const timeslotEntry = aggregatedEntries.find(
			(e) => DateHelper.equals(e.startTime, startDateTime) && DateHelper.equals(e.endTime, endDateTime),
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
		includeBookings: boolean = false,
		serviceProviderId?: number,
		serviceProviderIds?: number[],
	): Promise<AvailableTimeslotProviders[]> {
		const getAggregatedTimeslotEntriesWatch = new StopWatch('getAggregatedTimeslotEntries');
		const aggregatedEntries = await this.getAggregatedTimeslotEntries(
			startDateTime,
			endDateTime,
			serviceId,
			serviceProviderIds,
		);
		getAggregatedTimeslotEntriesWatch.stop();

		const bookings = await this.bookingsRepository.search({
			from: startDateTime,
			to: endDateTime,
			statuses: [BookingStatus.PendingApproval, BookingStatus.Accepted, BookingStatus.OnHold],
			serviceId,
			byPassAuth: true,
		});

		const acceptedBookings = bookings.filter((booking) => booking.status === BookingStatus.Accepted);
		const pendingBookings = bookings.filter((booking) => booking.status === BookingStatus.PendingApproval);
		const onHoldBookings = bookings.filter((booking) => {
			const onHoldUntil = booking.onHoldUntil;
			return booking.status === BookingStatus.OnHold && new Date() < onHoldUntil;
		});
		if (includeBookings) {
			TimeslotsService.mergeAcceptedBookingsToTimeslots(aggregatedEntries, acceptedBookings);
		}

		if (serviceProviderId) {
			for (const [key, value] of aggregatedEntries) {
				if (!value.hasGroupId(serviceProviderId)) {
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
			await this.filterVisibleServiceProviders({ entries: mappedEntries, serviceId, serviceProviderId }),
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
		serviceProviderId,
	}: {
		entries: Map<TimeslotKey, AvailableTimeslotProviders>;
		serviceId: number;
		serviceProviderId?: number;
	}): Promise<AvailableTimeslotProcessor> {
		const serviceProviders = await this.serviceProvidersRepo.getServiceProviders({ serviceId });
		let visibleServiceProviderIds = serviceProviders.map((sp) => sp.id);

		if (serviceProviderId) {
			visibleServiceProviderIds = visibleServiceProviderIds.filter((id) => id === serviceProviderId);
		}

		return new AvailableTimeslotProcessor(([key, entry]) => {
			entry.setVisibleServiceProviders(visibleServiceProviderIds);

			if (!entry.isValidAndVisible()) {
				entries.delete(key);
			}
		});
	}

	private static sortAvailableTimeslotProviders(a: AvailableTimeslotProviders, b: AvailableTimeslotProviders) {
		const checkStartTime = a.startTime.getTime() - b.startTime.getTime();
		return checkStartTime === 0 ? a.endTime.getTime() - b.endTime.getTime() : checkStartTime;
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
				if (unavailability.intersects(entry.startTime, entry.endTime)) {
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
					return booking.bookingIntersects({ start: element.startTime, end: element.endTime });
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

	private async getAggregatedTimeslotEntries(
		minStartTime: Date,
		maxEndTime: Date,
		serviceId: number,
		serviceProviderIds: number[] = [],
	): Promise<Map<TimeslotKey, AggregatedEntryId<ServiceProvider>>> {
		const aggregator = TimeslotAggregator.createCustom<ServiceProvider, AggregatedEntryId<ServiceProvider>>(
			AggregatedEntryId,
		);

		const service = await this.servicesRepository.getServiceWithTimeslotsSchedule(serviceId);
		if (!service) {
			return aggregator.getEntries();
		}

		const serviceProviders = await this.serviceProvidersRepo.getServiceProviders({
			ids: serviceProviderIds,
			serviceId,
			includeTimeslotsSchedule: true,
			skipAuthorisation: true, // loads all SPs regardless of user role
		});

		const validServiceTimeslots = Array.from(
			service.timeslotsSchedule?.generateValidTimeslots({
				startDatetime: minStartTime,
				endDatetime: maxEndTime,
			}) || [],
		);

		for (const provider of serviceProviders) {
			const timeslotServiceProviders = provider.timeslotsSchedule
				? provider.timeslotsSchedule.generateValidTimeslots({
						startDatetime: minStartTime,
						endDatetime: maxEndTime,
				  })
				: validServiceTimeslots;

			await aggregator.aggregate(provider, timeslotServiceProviders);
			await nextImmediateTick();
		}

		return aggregator.getEntries();
	}
}
