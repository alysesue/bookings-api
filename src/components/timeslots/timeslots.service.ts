import { Inject, Scope, Scoped } from 'typescript-ioc';
import { AggregatedEntry, TimeslotAggregator } from './timeslotAggregator';
import { Booking, BookingStatus, ServiceProvider, Timeslot } from '../../models';
import { DateHelper } from '../../infrastructure/dateHelper';
import { BookingsRepository } from '../bookings/bookings.repository';
import { groupByKey } from '../../tools/collections';
import { ServicesRepository } from '../services/services.repository';
import { ServiceProvidersRepository } from '../serviceProviders/serviceProviders.repository';
import { AvailableTimeslotProviders } from './availableTimeslotProviders';
import { UnavailabilitiesService } from '../unavailabilities/unavailabilities.service';
import { TimeslotWithCapacity } from '../../models/timeslotWithCapacity';

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

	private static timeslotKeySelector = (start: Date, end: Date) => `${start.getTime()}|${end.getTime()}`;
	private static bookingKeySelector = (booking: Booking) =>
		TimeslotsService.timeslotKeySelector(booking.startDateTime, booking.endDateTime);

	private static getAggregatedTimeslotsFromBookings(bookings: Booking[]) {
		const aggregator = new TimeslotAggregator<Booking>();

		for (const booking of bookings) {
			const timeslotForBooking = new TimeslotWithCapacity(booking.startDateTime, booking.endDateTime);
			aggregator.aggregate(booking, [timeslotForBooking]);
		}

		const entries = aggregator.getEntries();
		aggregator.clear();

		return entries;
	}

	private static mapServiceProviderAggregatedEntriesToTimeslots(
		entries: AggregatedEntry<ServiceProvider>[],
	): AvailableTimeslotProviders[] {
		return entries.map(AvailableTimeslotProviders.create);
	}

	private static mergeAggregatedBookingEntriesToTimeslots(
		mappedEntries: AvailableTimeslotProviders[],
		timeslotEntriesFromBookings: AggregatedEntry<Booking>[],
	): void {
		const entriesLookup = mappedEntries.reduce(
			(set, entry) => set.add(TimeslotsService.timeslotKeySelector(entry.startTime, entry.endTime)),
			new Set<string>(),
		);

		timeslotEntriesFromBookings.forEach((entry) => {
			const entryKey = TimeslotsService.timeslotKeySelector(
				entry.getTimeslot().getStartTime(),
				entry.getTimeslot().getEndTime(),
			);
			if (!entriesLookup.has(entryKey)) {
				mappedEntries.push(AvailableTimeslotProviders.createFromBooking(entry));
			}
		});
	}

	public async getAvailableProvidersForTimeslot(
		startDateTime: Date,
		endDateTime: Date,
		serviceId: number,
		serviceProviderId?: number,
	): Promise<AvailableTimeslotProviders> {
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

		return timeslotEntry || AvailableTimeslotProviders.empty(startDateTime, endDateTime);
	}

	private static setPendingTimeslots(entries: AvailableTimeslotProviders[], pendingBookings: Booking[]): void {
		const pendingBookingsLookup = groupByKey(pendingBookings, TimeslotsService.bookingKeySelector);

		for (const element of entries) {
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
		let aggregatedEntries = await this.getAggregatedTimeslotEntries(startDateTime, endDateTime, serviceId);

		console.log('aggregatedEntries', aggregatedEntries)
		const bookings = await this.bookingsRepository.search({
			from: startDateTime,
			to: endDateTime,
			statuses: [BookingStatus.PendingApproval, BookingStatus.Accepted],
			serviceId,
			byPassAuth: true,
		});

		const acceptedBookings = bookings.filter((booking) => booking.status === BookingStatus.Accepted);
		const pendingBookings = bookings.filter((booking) => booking.status === BookingStatus.PendingApproval);

		if (serviceProviderId) {
			aggregatedEntries = aggregatedEntries.filter((entry) =>
				entry.findGroup((sp) => sp.id === serviceProviderId),
			);
		}

		let mappedEntries = TimeslotsService.mapServiceProviderAggregatedEntriesToTimeslots(aggregatedEntries);
		mappedEntries = await this.filterUnavailabilities(startDateTime, endDateTime, serviceId, mappedEntries);

		if (includeBookings) {
			TimeslotsService.mergeAggregatedBookingEntriesToTimeslots(
				mappedEntries,
				TimeslotsService.getAggregatedTimeslotsFromBookings(bookings),
			);
		}

		this.setBookedProviders(mappedEntries, acceptedBookings);
		TimeslotsService.setPendingTimeslots(mappedEntries, pendingBookings);

		mappedEntries = await this.filterVisibleServiceProviders({
			entries: mappedEntries,
			serviceId,
			serviceProviderId,
		});

		return mappedEntries;
	}

	private async filterVisibleServiceProviders({
		entries,
		serviceId,
		serviceProviderId,
	}: {
		entries: AvailableTimeslotProviders[];
		serviceId: number;
		serviceProviderId?: number;
	}) {
		const visibleServiceProviderIds = (await this.serviceProvidersRepo.getServiceProviders({ serviceId })).map(
			(sp) => sp.id,
		);

		// for (const entry of entries) {
		// 	if (serviceProviderId) {
		// 		entry.filterServiceProviders([serviceProviderId]);
		// 	}

		// 	entry.filterServiceProviders(visibleServiceProviderIds);
		// }

		return entries.filter((e) => e.totalCount > 0);
	}

	private async filterUnavailabilities(
		startDateTime: Date,
		endDateTime: Date,
		serviceId: number,
		entries: AvailableTimeslotProviders[],
	): Promise<AvailableTimeslotProviders[]> {
		const unavailabilities = await this.unavailabilitiesService.search({
			from: startDateTime,
			to: endDateTime,
			serviceId,
			skipAuthorisation: true,
		});

		for (const unavailability of unavailabilities) {
			for (const entry of entries) {
				if (unavailability.intersects(entry.startTime, entry.endTime)) {
					entry.setUnavailability(unavailability);
				}
			}
		}

		return entries.filter((e) => e.totalCount > 0);
	}

	private setBookedProviders(entries: AvailableTimeslotProviders[], acceptedBookings: Booking[]): void {
		const acceptedBookingsLookup = groupByKey(acceptedBookings, TimeslotsService.bookingKeySelector);

		for (const element of entries) {
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
	): Promise<AggregatedEntry<ServiceProvider>[]> {
		const aggregator = new TimeslotAggregator<ServiceProvider>();

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
			const serviceProviderTimeslots = provider.timeslotsSchedule
				? provider.timeslotsSchedule.generateValidTimeslots({
					startDatetime: minStartTime,
					endDatetime: maxEndTime,
				})
				: validServiceTimeslots;

			aggregator.aggregate(provider, serviceProviderTimeslots);
		}

		const entries = aggregator.getEntries();
		aggregator.clear();

		return entries;
	}
}
