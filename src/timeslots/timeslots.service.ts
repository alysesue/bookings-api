import { Inject, Singleton } from "typescript-ioc";
import { AggregatedEntry, TimeslotAggregator } from "./timeslotAggregator";
import { Calendar } from '../models/calendar';
import { CalendarsRepository } from "../calendars/calendars.repository";
import { DateHelper } from "../infrastructure/dateHelper";
import { BookingsRepository } from "../bookings/bookings.repository";
import { Booking } from '../models/booking';
import { Timeslot } from '../models/Timeslot';
import { BookingStatus } from "../models";
import { BookingRequest, BookingSearchRequest } from '../bookings/bookings.apicontract';
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

	private async getAcceptedBookingsPerCalendarId(minStartTime: Date, maxEndTime: Date): Promise<Map<number, Booking[]>> {
		let bookings = await this.bookingsRepository.search(new BookingSearchRequest(
			minStartTime,
			maxEndTime,
			BookingStatus.Accepted
		));
		bookings = bookings.filter(booking => booking.getSessionEndTime() <= maxEndTime);

		const result = this.GroupByKey(bookings, (booking) => booking?.calendarId ?? 0);
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
		const bookingsLookup = this.GroupByKey(calendarBookings, this.bookingKeySelector);
		for (const element of generator) {
			const elementKey = this.timeslotKeySelector(element.getStartTime(), element.getEndTime());
			if (!bookingsLookup.has(elementKey)) {
				yield element;
			}
		}
	}

	private * deductPendingTimeslots(entries: Iterable<TimeslotResponse>, pendingBookings: Booking[]): Iterable<TimeslotResponse> {
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

	private async getAggregatedTimeslotEntries(minStartTime: Date, maxEndTime: Date): Promise<AggregatedEntry<Calendar>[]> {
		const aggregator = new TimeslotAggregator<Calendar>();

		const calendars = await this.calendarsRepository.getCalendarsWithTemplates();
		const bookingsPerCalendarId = await this.getAcceptedBookingsPerCalendarId(minStartTime, maxEndTime);

		for (const calendar of calendars.filter(c => c.templatesTimeslots !== null)) {
			const generator = calendar.templatesTimeslots.generateValidTimeslots({
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
