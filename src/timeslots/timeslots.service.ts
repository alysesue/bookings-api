import { Inject, Scope, Scoped } from "typescript-ioc";
import { AggregatedEntry, TimeslotAggregator } from "./timeslotAggregator";
import { Booking, BookingStatus, Calendar, ServiceProvider, Timeslot } from '../models';
import { CalendarsRepository } from "../calendars/calendars.repository";
import { DateHelper } from "../infrastructure/dateHelper";
import { BookingsRepository } from "../bookings/bookings.repository";
import { BookingSearchRequest } from '../bookings/bookings.apicontract';
import { TimeslotResponse } from './timeslots.apicontract';
import { groupByKey } from '../tools/collections';
import { ServicesRepository } from "../services/services.repository";
import { ServiceProvidersRepository } from "../serviceProviders/serviceProviders.repository";

@Scoped(Scope.Request)
export class TimeslotsService {
	@Inject
	private calendarsRepository: CalendarsRepository;

	@Inject
	private bookingsRepository: BookingsRepository;

	@Inject
	private servicesRepository: ServicesRepository;

	@Inject
	private serviceProvidersRepo: ServiceProvidersRepository;

	private async getAcceptedBookingsPerCalendarId(minStartTime: Date, maxEndTime: Date): Promise<Map<number, Booking[]>> {
		let bookings = await this.bookingsRepository.search(new BookingSearchRequest(
			minStartTime,
			maxEndTime,
			BookingStatus.Accepted
		));
		bookings = bookings.filter(booking => booking.getSessionEndTime() <= maxEndTime);

		const result = groupByKey(bookings, (booking) => booking?.calendarId ?? 0);
		return result;
	}

	private async getPendingBookings(minStartTime: Date, maxEndTime: Date): Promise<Booking[]> {
		let bookings = await this.bookingsRepository.search(new BookingSearchRequest(
			minStartTime,
			maxEndTime,
			BookingStatus.PendingApproval
		));

		bookings = bookings.filter(booking => booking.getSessionEndTime() <= maxEndTime);
		return bookings;
	}

	private timeslotKeySelector = (start: Date, end: Date) => `${start.getTime()}|${end.getTime()}`;
	private bookingKeySelector = (booking: Booking) => this.timeslotKeySelector(booking.startDateTime, booking.getSessionEndTime());

	private * ignoreBookedTimes(generator: Iterable<Timeslot>, calendarBookings: Booking[]): Iterable<Timeslot> {
		const bookingsLookup = groupByKey(calendarBookings, this.bookingKeySelector);
		for (const element of generator) {
			const elementKey = this.timeslotKeySelector(element.getStartTime(), element.getEndTime());
			if (!bookingsLookup.has(elementKey)) {
				yield element;
			}
		}
	}

	private * deductPendingTimeslots(entries: Iterable<TimeslotResponse>, pendingBookings: Booking[]): Iterable<TimeslotResponse> {
		const pendingBookingsLookup = groupByKey(pendingBookings, this.bookingKeySelector);

		for (const element of entries) {
			const elementKey = this.timeslotKeySelector(element.startTime, element.endTime);
			const pendingBookingsCount = pendingBookingsLookup.get(elementKey)?.length || 0;

			element.availabilityCount = element.availabilityCount - pendingBookingsCount;
			if (element.availabilityCount > 0) {
				yield element;
			}
		}
	}

	private async getAggregatedTimeslotEntries(minStartTime: Date, maxEndTime: Date, serviceId: number): Promise<AggregatedEntry<ServiceProvider>[]> {
		const aggregator = new TimeslotAggregator<ServiceProvider>();

		const service = await this.servicesRepository.getWithSchedule(serviceId);
		const schedule = service?.schedule;
		if (!schedule) {
			return aggregator.getEntries();
		}

		const serviceProviders = await this.serviceProvidersRepo.getServiceProviders(serviceId);
		const bookingsPerCalendarId = await this.getAcceptedBookingsPerCalendarId(minStartTime, maxEndTime);

		const validTimeslots = Array.from(schedule.generateValidTimeslots({
			startDatetime: minStartTime,
			endDatetime: maxEndTime
		}));

		for (const provider of serviceProviders) {
			const calendarBookings = (bookingsPerCalendarId.get(provider.calendar.id) || []);
			const generatorWithoutBookedTimes = this.ignoreBookedTimes(validTimeslots, calendarBookings);

			aggregator.aggregate(provider, generatorWithoutBookedTimes);
		}

		const entries = aggregator.getEntries();
		aggregator.clear();

		return entries;
	}

	public async getAggregatedTimeslots(startDate: Date, endDate: Date, serviceId: number): Promise<TimeslotResponse[]> {
		const startOfDay = DateHelper.getDateOnly(startDate);
		const endOfLastDay = DateHelper.getEndOfDay(endDate);

		return await this.getAggregatedTimeslotsExactMatch(startOfDay, endOfLastDay, serviceId);
	}

	public async getAggregatedTimeslotsExactMatch(startDateTime: Date, endDateTime: Date, serviceId: number): Promise<TimeslotResponse[]> {
		const aggregatedEntries = await this.getAggregatedTimeslotEntries(startDateTime, endDateTime, serviceId);
		const generateMappedEntries = this.mapDataModels(aggregatedEntries);

		const pendingBookings = await this.getPendingBookings(startDateTime, endDateTime);
		const mappedEntries = Array.from(this.deductPendingTimeslots(generateMappedEntries, pendingBookings));

		return mappedEntries;
	}

	public async getAvailableProvidersForTimeslot(startDateTime: Date, endDateTime: Date, serviceId: number): Promise<ServiceProvider[]> {
		const aggregatedEntries = await this.getAggregatedTimeslotEntries(startDateTime, endDateTime, serviceId);

		const timeslotEntry = aggregatedEntries.find(e => DateHelper.equals(e.getTimeslot().getStartTime(), startDateTime)
			&& DateHelper.equals(e.getTimeslot().getEndTime(), endDateTime));

		return timeslotEntry?.getGroups() || [];
	}

	private mapDataModel(entry: AggregatedEntry<ServiceProvider>): TimeslotResponse {
		return {
			startTime: entry.getTimeslot().getStartTime(),
			endTime: entry.getTimeslot().getEndTime(),
			availabilityCount: entry.getGroups().length
		} as TimeslotResponse;
	}

	private * mapDataModels(entries: AggregatedEntry<ServiceProvider>[]): Iterable<TimeslotResponse> {
		for (const entry of entries) {
			yield this.mapDataModel(entry);
		}
	}
}
