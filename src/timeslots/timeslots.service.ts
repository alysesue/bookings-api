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
import { forEach } from "lodash";

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

	private async getAcceptedBookings(minStartTime: Date, maxEndTime: Date): Promise<Booking[]> {
		let bookings = await this.bookingsRepository.search(new BookingSearchRequest(
			minStartTime,
			maxEndTime,
			BookingStatus.Accepted
		));
		bookings = bookings.filter(booking => booking.serviceProviderId && booking.getSessionEndTime() <= maxEndTime);
		return bookings;
	}

	private async getPendingBookings(minStartTime: Date, maxEndTime: Date, serviceId: number): Promise<Booking[]> {
		let bookings = await this.bookingsRepository.search(new BookingSearchRequest(
			minStartTime,
			maxEndTime,
			BookingStatus.PendingApproval,
			serviceId
		));

		bookings = bookings.filter(booking => booking.getSessionEndTime() <= maxEndTime);
		return bookings;
	}

	private timeslotKeySelector = (start: Date, end: Date) => `${start.getTime()}|${end.getTime()}`;
	private bookingKeySelector = (booking: Booking) => this.timeslotKeySelector(booking.startDateTime, booking.getSessionEndTime());

	private setAcceptedProviders(entries: AvailableTimeslotProviders[], acceptedBookings: Booking[]): void {
		const acceptedBookingsLookup = groupByKey(acceptedBookings, this.bookingKeySelector);

		for (const element of entries) {
			const elementKey = this.timeslotKeySelector(element.startTime, element.endTime);
			const acceptedBookingsForTimeslot = acceptedBookingsLookup.get(elementKey);
			if (acceptedBookingsForTimeslot) {
				const acceptedProviderIds = acceptedBookingsForTimeslot.reduce((set, booking) => set.add(booking.serviceProviderId), new Set<number>());
				element.acceptedProviders = element.slotServiceProviders.filter(sp => acceptedProviderIds.has(sp.id));
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

	private async getAggregatedTimeslotEntries(minStartTime: Date, maxEndTime: Date, serviceId: number): Promise<AggregatedEntry<ServiceProvider>[]> {
		const aggregator = new TimeslotAggregator<ServiceProvider>();

		const service = await this.servicesRepository.getServiceWithSchedule(serviceId);
		const schedule = service?.schedule;
		if (!schedule) {
			return aggregator.getEntries();
		}

		const serviceProviders = await this.serviceProvidersRepo.getServiceProviders({ serviceId, includeSchedule: true });

		const validTimeslots = Array.from(schedule.generateValidTimeslots({
			startDatetime: minStartTime,
			endDatetime: maxEndTime
		}));

		for (const provider of serviceProviders) {
			aggregator.aggregate(provider, validTimeslots);
		}

		const entries = aggregator.getEntries();
		aggregator.clear();

		return entries;
	}

	public async getAggregatedTimeslots(startDateTime: Date, endDateTime: Date, serviceId: number): Promise<AvailableTimeslotProviders[]> {
		const aggregatedEntries = await this.getAggregatedTimeslotEntries(startDateTime, endDateTime, serviceId);
		const pendingBookings = await this.getPendingBookings(startDateTime, endDateTime, serviceId);
		const acceptedBookings = await this.getAcceptedBookings(startDateTime, endDateTime);

		const mappedEntries = this.mapDataModels(aggregatedEntries);
		this.setAcceptedProviders(mappedEntries, acceptedBookings);
		this.setPendingTimeslots(mappedEntries, pendingBookings);

		return mappedEntries;
	}

	public async getAvailableProvidersForTimeslot(startDateTime: Date, endDateTime: Date, serviceId: number): Promise<AvailableTimeslotProviders> {
		const aggregatedEntries = await this.getAggregatedTimeslots(startDateTime, endDateTime, serviceId);

		const timeslotEntry = aggregatedEntries.find(e => DateHelper.equals(e.startTime, startDateTime)
			&& DateHelper.equals(e.endTime, endDateTime));

		return timeslotEntry || AvailableTimeslotProviders.empty(startDateTime, endDateTime);
	}

	private mapDataModels(entries: AggregatedEntry<ServiceProvider>[]): AvailableTimeslotProviders[] {
		return entries.map(e => AvailableTimeslotProviders.create(e));
	}
}

export class AvailableTimeslotProviders {
	public startTime: Date;
	public endTime: Date;
	public slotServiceProviders: ServiceProvider[];
	public acceptedProviders: ServiceProvider[];
	public pendingBookingsCount: number;

	constructor() {
		this.slotServiceProviders = [];
		this.acceptedProviders = [];
		this.pendingBookingsCount = 0;
	}

	public get availableServiceProviders(): ServiceProvider[] {
		const bookedProviderIds = this.acceptedProviders.reduce((set, sp) => set.add(sp.id), new Set<number>());
		const availableProviders = this.slotServiceProviders.filter(sp => !bookedProviderIds.has(sp.id));
		return availableProviders;
	}

	public get availabilityCount(): number {
		return this.slotServiceProviders.length - this.acceptedProviders.length - this.pendingBookingsCount;
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
		instance.slotServiceProviders = entry.getGroups();

		return instance;
	}
}
