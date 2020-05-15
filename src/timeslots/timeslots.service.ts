import { Inject, Singleton } from "typescript-ioc";
import { AggregatedEntry, TimeslotAggregator } from "./timeslotAggregator";
import { Calendar } from '../models/calendar';
import { CalendarsRepository } from "../calendars/calendars.repository";
import { DateHelper } from "../infrastructure/dateHelper";
import { BookingsRepository } from "../bookings/bookings.repository";
import { Booking } from '../models/booking';
import { Timeslot } from '../models/Timeslot';
import { BookingStatus } from "../models";
import { BookingSearchRequest } from '../bookings/bookings.apicontract';
import { TimeslotResponse } from './timeslots.apicontract';

@Singleton
export class TimeslotsService {
	@Inject
	private calendarsRepository: CalendarsRepository;

	@Inject
	private bookingsRepository: BookingsRepository;

	private GroupByKey<TKey, TValue>(elements: TValue[], keySelector: (value: TValue) => TKey): Map<TKey, TValue[]> {
		const initial = new Map<TKey, TValue[]>();
		if (!elements) {
			return initial;
		}

		const result = elements.reduce((map, current) => {
			const key = keySelector(current);
			const groupCollection = map.get(key) || [];
			groupCollection.push(current);

			map.set(key, groupCollection);
			return map;
		}, initial);

		return result;
	}

	private async getBookingsPerCalendarId(startOfDay: Date, endOfLastDay: Date): Promise<Map<number, Booking[]>> {
		let bookings = await this.bookingsRepository.search(new BookingSearchRequest(
			startOfDay,
			endOfLastDay
		));
		bookings = bookings.filter(booking => booking.getSessionEndTime() <= endOfLastDay);

		const result = this.GroupByKey(bookings, (booking) => booking?.calendarId ?? 0);
		return result;
	}

	private timeslotKeySelector = (start: Date, end: Date) => `${start.getTime()}|${end.getTime()}`;
	private bookingKeySelector = (booking: Booking) => this.timeslotKeySelector(booking.startDateTime, booking.getSessionEndTime());

	private * ignoreBookedTimes(generator: Iterable<Timeslot>, calendarBookings: Booking[]): Iterable<Timeslot> {
		const bookingsLookup = this.GroupByKey(calendarBookings, this.bookingKeySelector);
		for (const element of generator) {
			const elementKey = this.timeslotKeySelector(element.getStartTime(), element.getEndTime());
			if (!bookingsLookup.has(elementKey)) {
				yield element;
			}
		}
	}

	private * deductPendingTimeslots(entries: Iterable<TimeslotResponse>, bookingsPerCalendarId: Map<number, Booking[]>): Iterable<TimeslotResponse> {
		const pendingBookings = (bookingsPerCalendarId.get(0) || []).filter(booking => booking.status === BookingStatus.PendingApproval);
		const pendingBookingsLookup = this.GroupByKey(pendingBookings, this.bookingKeySelector);

		for (const element of entries) {
			const elementKey = this.timeslotKeySelector(element.startTime, element.endTime);
			const pendingBookingsCount = pendingBookingsLookup.get(elementKey)?.length || 0;

			element.availabilityCount = element.availabilityCount - pendingBookingsCount;
			if (element.availabilityCount > 0) {
				yield element;
			}
		}
	}

	public async getAggregatedTimeslots(startDate: Date, endDate: Date): Promise<TimeslotResponse[]> {
		const aggregator = new TimeslotAggregator<Calendar>();
		const startOfDay = DateHelper.getDateOnly(startDate);
		const endOfLastDay = DateHelper.getEndOfDay(endDate);

		const calendars = await this.calendarsRepository.getCalendarsWithTemplates();
		const bookingsPerCalendarId = await this.getBookingsPerCalendarId(startOfDay, endOfLastDay);

		for (const calendar of calendars.filter(c => c.templatesTimeslots !== null)) {
			const generator = calendar.templatesTimeslots.generateValidTimeslots({
				startDatetime: startOfDay,
				endDatetime: endOfLastDay
			});
			const calendarBookings = (bookingsPerCalendarId.get(calendar.id) || []).filter(booking => booking.status === BookingStatus.Accepted);
			const generatorWithoutBookedTimes = this.ignoreBookedTimes(generator, calendarBookings);

			aggregator.aggregate(calendar, generatorWithoutBookedTimes);
		}

		const entries = aggregator.getEntries();
		aggregator.clear();

		const generateMappedEntries = this.mapDataModels(entries);
		const mappedEntries = Array.from(this.deductPendingTimeslots(generateMappedEntries, bookingsPerCalendarId));

		return mappedEntries;
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
