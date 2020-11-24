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

	private static getAggregatedTimeslotsFromBookings(bookings: Booking[]) {
		const aggregator = TimeslotAggregator.createCustom<Booking, AggregatedEntryId<Booking>>(AggregatedEntryId);

		for (const booking of bookings) {
			const timeslotForBooking = new TimeslotWithCapacity(booking.startDateTime, booking.endDateTime, 0);
			aggregator.aggregate(booking, [timeslotForBooking]);
		}

		const entries = aggregator.getEntries();
		return entries;
	}

	private static mapServiceProviderAggregatedEntriesToTimeslots(
		entries: Map<TimeslotKey, AggregatedEntryId<ServiceProvider>>,
	): Map<TimeslotKey, AvailableTimeslotProviders> {
		const result = new Map<TimeslotKey, AvailableTimeslotProviders>();
		for (const [key, entry] of entries) {
			const mapped = AvailableTimeslotProviders.create(entry);
			result.set(key, mapped);
		}

		return result;
	}

	private static mergeAggregatedBookingEntriesToTimeslots(
		aggregatedEntries: Map<TimeslotKey, AggregatedEntryId<ServiceProvider>>,
		timeslotEntriesFromBookings: Map<TimeslotKey, AggregatedEntryId<Booking>>,
	): void {
		for (const [timeslotKey, aggregatedBookings] of timeslotEntriesFromBookings) {
			let aggregatedEntry = aggregatedEntries.get(timeslotKey);
			const timeslot = aggregatedBookings.getTimeslot();

			if (!aggregatedEntry) {
				aggregatedEntry = new AggregatedEntryId<ServiceProvider>(timeslot);
				aggregatedEntries.set(timeslotKey, aggregatedEntry);
			}

			for (const [booking, timeslotWithCapacity] of aggregatedBookings.getGroups()) {
				if (!aggregatedEntry.hasGroupId(booking.serviceProvider.id)) {
					aggregatedEntry.addGroup(booking.serviceProvider, timeslotWithCapacity);
				}
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

	private static setPendingTimeslots(
		entries: Map<TimeslotKey, AvailableTimeslotProviders>,
		pendingBookings: Booking[],
	): void {
		const pendingBookingsLookup = groupByKey(pendingBookings, TimeslotsService.bookingKeySelector);

		for (const element of entries.values()) {
			const elementKey = TimeslotsService.timeslotKeySelector(element.startTime, element.endTime);
			const elementPendingBookings = pendingBookingsLookup.get(elementKey);
			if (elementPendingBookings) {
				element.setPendingBookings(elementPendingBookings);
			}
		}
	}

	public async getAggregatedTimeslots(
		startDateTime: Date,
		endDateTime: Date,
		serviceId: number,
		includeBookings: boolean = false,
		serviceProviderId?: number,
	): Promise<AvailableTimeslotProviders[]> {
		const aggregatedEntries = await this.getAggregatedTimeslotEntries(startDateTime, endDateTime, serviceId);

		const bookings = await this.bookingsRepository.search({
			from: startDateTime,
			to: endDateTime,
			statuses: [BookingStatus.PendingApproval, BookingStatus.Accepted],
			serviceId,
			byPassAuth: true,
		});

		const acceptedBookings = bookings.filter((booking) => booking.status === BookingStatus.Accepted);
		const pendingBookings = bookings.filter((booking) => booking.status === BookingStatus.PendingApproval);

		if (includeBookings) {
			TimeslotsService.mergeAggregatedBookingEntriesToTimeslots(
				aggregatedEntries,
				TimeslotsService.getAggregatedTimeslotsFromBookings(acceptedBookings),
			);
		}

		if (serviceProviderId) {
			for (const [key, value] of aggregatedEntries) {
				if (!value.hasGroupId(serviceProviderId)) {
					aggregatedEntries.delete(key);
				}
			}
		}

		const mappedEntries = TimeslotsService.mapServiceProviderAggregatedEntriesToTimeslots(aggregatedEntries);
		await this.filterUnavailabilities(startDateTime, endDateTime, serviceId, mappedEntries);

		this.setBookedProviders(mappedEntries, acceptedBookings);
		TimeslotsService.setPendingTimeslots(mappedEntries, pendingBookings);
		await this.filterVisibleServiceProviders({ entries: mappedEntries, serviceId, serviceProviderId });

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
	}): Promise<void> {
		const serviceProviders = await this.serviceProvidersRepo.getServiceProviders({ serviceId });
		let visibleServiceProviderIds = serviceProviders.map((sp) => sp.id);

		if (serviceProviderId) {
			visibleServiceProviderIds = visibleServiceProviderIds.filter((id) => id === serviceProviderId);
		}

		for (const [key, entry] of entries) {
			entry.setVisibleServiceProviders(visibleServiceProviderIds);

			if (!entry.isValidAndVisible()) {
				entries.delete(key);
			}
		}
	}

	private static sortAvailableTimeslotProviders(a: AvailableTimeslotProviders, b: AvailableTimeslotProviders) {
		const checkStartTime = a.startTime.getTime() - b.startTime.getTime();
		return checkStartTime === 0 ? a.endTime.getTime() - b.endTime.getTime() : checkStartTime;
	}

	private async filterUnavailabilities(
		startDateTime: Date,
		endDateTime: Date,
		serviceId: number,
		entries: Map<TimeslotKey, AvailableTimeslotProviders>,
	): Promise<void> {
		const unavailabilities = await this.unavailabilitiesService.search({
			from: startDateTime,
			to: endDateTime,
			serviceId,
			skipAuthorisation: true,
		});

		for (const entry of entries.values()) {
			for (const unavailability of unavailabilities) {
				if (unavailability.intersects(entry.startTime, entry.endTime)) {
					entry.setUnavailability(unavailability);
				}
			}
		}
	}

	private setBookedProviders(
		entries: Map<TimeslotKey, AvailableTimeslotProviders>,
		acceptedBookings: Booking[],
	): void {
		const acceptedBookingsLookup = groupByKey(acceptedBookings, TimeslotsService.bookingKeySelector);

		for (const element of entries.values()) {
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
		}
	}

	private async getAggregatedTimeslotEntries(
		minStartTime: Date,
		maxEndTime: Date,
		serviceId: number,
	): Promise<Map<TimeslotKey, AggregatedEntryId<ServiceProvider>>> {
		const aggregator = TimeslotAggregator.createCustom<ServiceProvider, AggregatedEntryId<ServiceProvider>>(
			AggregatedEntryId,
		);

		const service = await this.servicesRepository.getServiceWithTimeslotsSchedule(serviceId);
		if (!service) {
			return aggregator.getEntries();
		}

		const serviceProviders = await this.serviceProvidersRepo.getServiceProviders({
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

			aggregator.aggregate(provider, timeslotServiceProviders);
		}

		return aggregator.getEntries();
	}
}
