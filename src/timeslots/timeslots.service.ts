import { Inject, Singleton } from "typescript-ioc";
import { AggregatedEntry, TimeslotAggregator } from "./timeslotAggregator";
import { Calendar } from '../models/calendar';
import { CalendarsRepository } from "../calendars/calendars.repository";
import { DateHelper } from "../infrastructure/dateHelper";
import { BookingsRepository } from "../bookings/bookings.repository";
import { Booking } from '../models/booking';
import { Timeslot } from '../models/Timeslot';

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
		let bookings = await this.bookingsRepository.getBookings({
			minStartDateTime: startOfDay,
			maxStartDateTime: endOfLastDay
		});
		bookings = bookings.filter(booking => booking.getSessionEndTime() <= endOfLastDay && !!booking.calendarId);

		const result = this.GroupByKey(bookings, (booking) => booking.calendarId);
		return result;
	}

	private * ignoreBookedTimes(generator: Iterable<Timeslot>, calendarBookings: Booking[]): Iterable<Timeslot> {
		const timeslotKeySelector = (start: Date, end: Date) => `${start.getTime()}|${end.getTime()}`;
		const bookingKeySelector = (booking: Booking) => timeslotKeySelector(booking.startDateTime, booking.getSessionEndTime());

		const bookingsLookup = this.GroupByKey(calendarBookings, bookingKeySelector);
		for (const element of generator) {
			const elementKey = timeslotKeySelector(element.getStartTime(), element.getEndTime());
			if (!bookingsLookup.has(elementKey)) {
				yield element;
			}
		}
	}

	public async getAggregatedTimeslots(startDate: Date, endDate: Date): Promise<AggregatedEntry<Calendar>[]> {
		const aggregator = new TimeslotAggregator<Calendar>();
		const startOfDay = DateHelper.getDateOnly(startDate);
		const endOfLastDay = DateHelper.getEndOfDay(endDate);

		const calendars = await this.calendarsRepository.getCalendarsWithTemplates();
		const bookingsPerCalendar = await this.getBookingsPerCalendarId(startOfDay, endOfLastDay);

		for (const calendar of calendars.filter(c => c.templatesTimeslots !== null)) {
			const generator = calendar.templatesTimeslots.generateValidTimeslots({
				startDatetime: startOfDay,
				endDatetime: endOfLastDay
			});
			const calendarBookings = bookingsPerCalendar.get(calendar.id) || [];
			const generatorWithoutBookedTimes = this.ignoreBookedTimes(generator, calendarBookings);

			aggregator.aggregate(calendar, generatorWithoutBookedTimes);
		}

		const entries = aggregator.getEntries();
		aggregator.clear();

		return entries;
	}
}
