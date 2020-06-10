import { Inject, Scope, Scoped } from "typescript-ioc";
import { AggregatedEntry, TimeslotAggregator } from "./timeslotAggregator";
import { Booking, BookingStatus, Calendar, ServiceProvider, Timeslot } from '../models';
import { CalendarsRepository } from "../calendars/calendars.repository";
import { DateHelper } from "../infrastructure/dateHelper";
import { BookingsRepository } from "../bookings/bookings.repository";
import { BookingSearchRequest } from '../bookings/bookings.apicontract';
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

	private async getAcceptedBookingsPerProviderId(minStartTime: Date, maxEndTime: Date): Promise<Map<number, Booking[]>> {
		let bookings = await this.bookingsRepository.search(new BookingSearchRequest(
			minStartTime,
			maxEndTime,
			BookingStatus.Accepted
		));
		bookings = bookings.filter(booking => booking.getSessionEndTime() <= maxEndTime);

		const result = groupByKey(bookings, (booking) => booking?.serviceProviderId ?? 0);
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

	private * setPendingTimeslots(entries: Iterable<AvailableTimeslotProviders>, pendingBookings: Booking[]): Iterable<AvailableTimeslotProviders> {
		const pendingBookingsLookup = groupByKey(pendingBookings, this.bookingKeySelector);

		for (const element of entries) {
			const elementKey = this.timeslotKeySelector(element.startTime, element.endTime);
			element.pendingBookingsCount = pendingBookingsLookup.get(elementKey)?.length || 0;
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
		const bookingsPerProviderId = await this.getAcceptedBookingsPerProviderId(minStartTime, maxEndTime);

		const validTimeslots = Array.from(schedule.generateValidTimeslots({
			startDatetime: minStartTime,
			endDatetime: maxEndTime
		}));

		for (const provider of serviceProviders) {
			const providerBookings = (bookingsPerProviderId.get(provider.id) || []);
			const generatorWithoutBookedTimes = this.ignoreBookedTimes(validTimeslots, providerBookings);

			aggregator.aggregate(provider, generatorWithoutBookedTimes);
		}

		const entries = aggregator.getEntries();
		aggregator.clear();

		return entries;
	}

	public async getAggregatedTimeslots(startDate: Date, endDate: Date, serviceId: number): Promise<AvailableTimeslotProviders[]> {
		const startOfDay = DateHelper.getDateOnly(startDate);
		const endOfLastDay = DateHelper.getEndOfDay(endDate);

		return await this.getAggregatedTimeslotsExactMatch(startOfDay, endOfLastDay, serviceId);
	}

	public async getAggregatedTimeslotsExactMatch(startDateTime: Date, endDateTime: Date, serviceId: number): Promise<AvailableTimeslotProviders[]> {
		const aggregatedEntries = await this.getAggregatedTimeslotEntries(startDateTime, endDateTime, serviceId);
		const generateMappedEntries = this.mapDataModels(aggregatedEntries);

		const pendingBookings = await this.getPendingBookings(startDateTime, endDateTime);
		let mappedEntries = Array.from(this.setPendingTimeslots(generateMappedEntries, pendingBookings));
		mappedEntries = mappedEntries.filter(e => e.availabilityCount > 0);

		return mappedEntries;
	}

	public async getAvailableProvidersForTimeslot(startDateTime: Date, endDateTime: Date, serviceId: number): Promise<AvailableTimeslotProviders> {
		const aggregatedEntries = await this.getAggregatedTimeslotsExactMatch(startDateTime, endDateTime, serviceId);

		const timeslotEntry = aggregatedEntries.find(e => DateHelper.equals(e.startTime, startDateTime)
			&& DateHelper.equals(e.endTime, endDateTime));

		return timeslotEntry || AvailableTimeslotProviders.empty(startDateTime, endDateTime);
	}

	private * mapDataModels(entries: AggregatedEntry<ServiceProvider>[]): Iterable<AvailableTimeslotProviders> {
		for (const entry of entries) {
			yield AvailableTimeslotProviders.create(entry);
		}
	}
}

export class AvailableTimeslotProviders {
	public startTime: Date;
	public endTime: Date;
	public serviceProviders: ServiceProvider[];
	public pendingBookingsCount: number;

	constructor() {
		this.serviceProviders = [];
		this.pendingBookingsCount = 0;
	}

	public get availabilityCount(): number {
		return this.serviceProviders.length - this.pendingBookingsCount;
	}

	public static empty(startTime: Date, endTime: Date): AvailableTimeslotProviders {
		const instance = new AvailableTimeslotProviders();
		instance.startTime = startTime;
		instance.endTime = endTime;

		return instance;
	}

	public static create(entry: AggregatedEntry<ServiceProvider>): AvailableTimeslotProviders {
		const instance = new AvailableTimeslotProviders();
		instance.startTime = entry.getTimeslot().getStartTime();
		instance.endTime = entry.getTimeslot().getEndTime();
		instance.serviceProviders = entry.getGroups();

		return instance;
	}
}
