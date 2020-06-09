import { Inject, Scope, Scoped } from "typescript-ioc";
import { AggregatedEntry, TimeslotAggregator } from "./timeslotAggregator";
import { Booking, BookingStatus, Calendar, Timeslot } from '../models';
import { CalendarsRepository } from "../calendars/calendars.repository";
import { DateHelper } from "../infrastructure/dateHelper";
import { BookingsRepository } from "../bookings/bookings.repository";
import { BookingSearchRequest } from '../bookings/bookings.apicontract';
import { TimeslotResponse } from './timeslots.apicontract';
import { groupByKey } from '../tools/collections';

@Scoped(Scope.Request)
export class TimeslotsService {
	@Inject
	private calendarsRepository: CalendarsRepository;

	@Inject
	private bookingsRepository: BookingsRepository;

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

	private async getAggregatedTimeslotEntries(minStartTime: Date, maxEndTime: Date): Promise<AggregatedEntry<Calendar>[]> {
		const aggregator = new TimeslotAggregator<Calendar>();

		const calendars = await this.calendarsRepository.getCalendarsWithTemplates();
		const bookingsPerCalendarId = await this.getAcceptedBookingsPerCalendarId(minStartTime, maxEndTime);

		for (const calendar of calendars.filter(c => !!c.schedule)) {
			const generator = calendar.schedule.generateValidTimeslots({
				startDatetime: minStartTime,
				endDatetime: maxEndTime
			});
			const calendarBookings = (bookingsPerCalendarId.get(calendar.id) || []);
			const generatorWithoutBookedTimes = this.ignoreBookedTimes(generator, calendarBookings);

			aggregator.aggregate(calendar, generatorWithoutBookedTimes);
		}

		const entries = aggregator.getEntries();
		aggregator.clear();

		return entries;
	}

	public async getAggregatedTimeslots(startDate: Date, endDate: Date): Promise<TimeslotResponse[]> {
		const startOfDay = DateHelper.getDateOnly(startDate);
		const endOfLastDay = DateHelper.getEndOfDay(endDate);

		const aggregatedEntries = await this.getAggregatedTimeslotEntries(startOfDay, endOfLastDay);
		const generateMappedEntries = this.mapDataModels(aggregatedEntries);

		const pendingBookings = await this.getPendingBookings(startOfDay, endOfLastDay);
		const mappedEntries = Array.from(this.deductPendingTimeslots(generateMappedEntries, pendingBookings));

		return mappedEntries;
	}

	public async getAvailableCalendarsForTimeslot(startDateTime: Date, endDateTime: Date): Promise<Calendar[]> {
		const aggregatedEntries = await this.getAggregatedTimeslotEntries(startDateTime, endDateTime);

		const timeslotEntry = aggregatedEntries.find(e => DateHelper.equals(e.getTimeslot().getStartTime(), startDateTime)
			&& DateHelper.equals(e.getTimeslot().getEndTime(), endDateTime));

		return timeslotEntry?.getGroups() || [];
	}

	private mapDataModel(entry: AggregatedEntry<Calendar>): TimeslotResponse {
		return {
			startTime: entry.getTimeslot().getStartTime(),
			endTime: entry.getTimeslot().getEndTime(),
			availabilityCount: entry.getGroups().length
		} as TimeslotResponse;
	}

	private * mapDataModels(entries: AggregatedEntry<Calendar>[]): Iterable<TimeslotResponse> {
		for (const entry of entries) {
			yield this.mapDataModel(entry);
		}
	}
}
