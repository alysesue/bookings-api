import { Inject, Scope, Scoped } from "typescript-ioc";
import { AggregatedEntry, TimeslotAggregator } from "./timeslotAggregator";
import { Booking, BookingStatus, ServiceProvider, Unavailability } from '../models';
import { DateHelper } from "../infrastructure/dateHelper";
import { BookingsRepository } from "../bookings/bookings.repository";
import { groupByKey } from '../tools/collections';
import { ServicesRepository } from "../services/services.repository";
import { ServiceProvidersRepository } from "../serviceProviders/serviceProviders.repository";
import { AvailableTimeslotProviders } from './availableTimeslotProviders';
import { intersectsDateTime, intersectsDateTimeSpan } from "../tools/timeSpan";
import { BookingSearchRequest } from "../bookings/bookings.apicontract";
import { UnavailabilitiesService } from "../unavailabilities/unavailabilities.service";

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

	private timeslotKeySelector = (start: Date, end: Date) => `${start.getTime()}|${end.getTime()}`;
	private bookingKeySelector = (booking: Booking) => this.timeslotKeySelector(booking.startDateTime, booking.getSessionEndTime());

	private setBookedProviders(entries: AvailableTimeslotProviders[], acceptedBookings: Booking[]): void {
		const acceptedBookingsLookup = groupByKey(acceptedBookings, this.bookingKeySelector);

		for (const element of entries) {
			const result = acceptedBookings.filter(booking => {
				return intersectsDateTimeSpan({ start: booking.startDateTime, end: booking.getSessionEndTime() }, element.startTime, element.endTime);
			}).map(booking => booking.serviceProviderId);
			element.setOverlappingServiceProviders(result);

			const elementKey = this.timeslotKeySelector(element.startTime, element.endTime);
			const acceptedBookingsForTimeslot = acceptedBookingsLookup.get(elementKey);
			if (acceptedBookingsForTimeslot) {
				element.setBookedServiceProviders(acceptedBookingsForTimeslot.map(booking => booking.serviceProviderId));
			}
		}
	}

	private setPendingTimeslots(entries: AvailableTimeslotProviders[], pendingBookings: Booking[]): void {
		const pendingBookingsLookup = groupByKey(pendingBookings, this.bookingKeySelector);

		for (const element of entries) {
			const elementKey = this.timeslotKeySelector(element.startTime, element.endTime);
			element.pendingBookingsCount = pendingBookingsLookup.get(elementKey)?.length || 0;
		}
	}

	private async filterUnavailabilities(startDateTime: Date, endDateTime: Date, serviceId: number, entries: AvailableTimeslotProviders[])
		: Promise<AvailableTimeslotProviders[]> {
		const unavailabilities = await this.unavailabilitiesService.search({ from: startDateTime, to: endDateTime, serviceId });

		for (const unavailability of unavailabilities) {
			for (const entry of entries) {
				if (unavailability.intersects(entry.startTime, entry.endTime)) {
					entry.setUnavailability(unavailability);
				}
			}
		}

		return entries.filter(e => e.availableServiceProviders.length > 0 || e.bookedServiceProviders.length > 0);
	}


	private async getAggregatedTimeslotEntries(minStartTime: Date, maxEndTime: Date, serviceId: number): Promise<AggregatedEntry<ServiceProvider>[]> {
		const aggregator = new TimeslotAggregator<ServiceProvider>();

		const service = await this.servicesRepository.getServiceWithTimeslotsSchedule(serviceId);
		if (!service) {
			return aggregator.getEntries();
		}

		const serviceProviders = await this.serviceProvidersRepo.getServiceProviders({ serviceId, includeTimeslotsSchedule: true });

		const validServiceTimeslots = Array.from(service.timeslotsSchedule?.generateValidTimeslots({
			startDatetime: minStartTime,
			endDatetime: maxEndTime
		}) || []);

		for (const provider of serviceProviders) {
			const serviceProviderTimeslots = provider.timeslotsSchedule ?
				provider.timeslotsSchedule.generateValidTimeslots({
					startDatetime: minStartTime,
					endDatetime: maxEndTime
				}) : validServiceTimeslots;

			aggregator.aggregate(provider, serviceProviderTimeslots);
		}

		const entries = aggregator.getEntries();
		aggregator.clear();

		return entries;
	}

	public async getAggregatedTimeslots(startDateTime: Date, endDateTime: Date, serviceId: number, serviceProviderId?: number): Promise<AvailableTimeslotProviders[]> {
		let aggregatedEntries = await this.getAggregatedTimeslotEntries(startDateTime, endDateTime, serviceId);
		const pendingAndAcceptedBookings = await this.bookingsRepository.search(
			new BookingSearchRequest(
				startDateTime,
				endDateTime,
				[BookingStatus.PendingApproval, BookingStatus.Accepted],
				serviceId
			)
		);

		const acceptedBookings = pendingAndAcceptedBookings.filter(booking => booking.status === BookingStatus.Accepted);
		const pendingBookings = pendingAndAcceptedBookings.filter(booking => booking.status === BookingStatus.PendingApproval);

		if (serviceProviderId) {
			aggregatedEntries = aggregatedEntries.filter(entry => entry.getGroups().find(sp => sp.id === serviceProviderId));
		}

		let mappedEntries = this.mapDataModels(aggregatedEntries);
		mappedEntries = await this.filterUnavailabilities(startDateTime, endDateTime, serviceId, mappedEntries);
		this.setBookedProviders(mappedEntries, acceptedBookings);
		this.setPendingTimeslots(mappedEntries, pendingBookings);

		if (serviceProviderId) {
			for (const entry of mappedEntries) {
				entry.keepOnlyServiceProvider(serviceProviderId);
			}
		}

		return mappedEntries;
	}

	public async getAvailableProvidersForTimeslot(startDateTime: Date, endDateTime: Date, serviceId: number, serviceProviderId?: number): Promise<AvailableTimeslotProviders> {
		const aggregatedEntries = await this.getAggregatedTimeslots(startDateTime, endDateTime, serviceId, serviceProviderId);

		const timeslotEntry = aggregatedEntries.find(e => DateHelper.equals(e.startTime, startDateTime)
			&& DateHelper.equals(e.endTime, endDateTime));

		return timeslotEntry || AvailableTimeslotProviders.empty(startDateTime, endDateTime);
	}

	private mapDataModels(entries: AggregatedEntry<ServiceProvider>[]): AvailableTimeslotProviders[] {
		return entries.map(e => AvailableTimeslotProviders.create(e));
	}
}
