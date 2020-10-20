import { AggregatedEntry } from './timeslotAggregator';
import { Booking, ServiceProvider, Unavailability } from '../../models';
import { groupByKey } from '../../tools/collections';
import { ServiceProviderTimeslot } from '../../models/serviceProviderTimeslot';
import { TimeslotWithCapacity } from '../../models/timeslotWithCapacity';

export class AvailableTimeslotProviders {
	public startTime: Date;
	public endTime: Date;
	private _serviceProviderTimeslots: Map<number, ServiceProviderTimeslot>;
	private _unlinkedPendingBookingsCount: number;

	constructor() {
		this._serviceProviderTimeslots = new Map<number, ServiceProviderTimeslot>();
		this._unlinkedPendingBookingsCount = 0;
	}

	public get serviceProviderTimeslots(): Map<number, ServiceProviderTimeslot> {
		return this._serviceProviderTimeslots;
	}

	public get availabilityCount(): number {
		let sumOfAvailability = 0;
		this._serviceProviderTimeslots.forEach((item) => {
			sumOfAvailability += item.availabilityCount;
		});
		return Math.max(sumOfAvailability - this._unlinkedPendingBookingsCount, 0);
	}

	public get isValid(): boolean {
		for (const item of this._serviceProviderTimeslots) {
			const [, timeslotSp] = item;
			if (timeslotSp.isValid) return true;
		}
		return false;
	}

	public static empty(startTime: Date, endTime: Date): AvailableTimeslotProviders {
		const instance = new AvailableTimeslotProviders();
		instance.startTime = startTime;
		instance.endTime = endTime;
		return instance;
	}

	public static create(entry: AggregatedEntry<ServiceProvider>): AvailableTimeslotProviders {
		const instance = AvailableTimeslotProviders.empty(
			entry.getTimeslot().getStartTime(),
			entry.getTimeslot().getEndTime(),
		);
		instance.setRelatedServiceProviders(entry.getGroups());
		return instance;
	}

	public static createFromBooking(entry: AggregatedEntry<Booking>): AvailableTimeslotProviders {
		const instance = AvailableTimeslotProviders.empty(
			entry.getTimeslot().getStartTime(),
			entry.getTimeslot().getEndTime(),
		);

		const bookings = Array.from(entry.getGroups().keys());
		bookings
			.filter((booking) => booking.serviceProvider)
			.forEach((booking) => {
				const spTimeslotItem = new ServiceProviderTimeslot(booking.serviceProvider, 1);
				instance._serviceProviderTimeslots.set(booking.serviceProviderId, spTimeslotItem);
			});
		return instance;
	}

	public setRelatedServiceProviders(providers: Map<ServiceProvider, TimeslotWithCapacity>) {
		this._serviceProviderTimeslots = new Map<number, ServiceProviderTimeslot>();
		for (const item of providers) {
			const [spItem, timeslotCapacity] = item;
			const spTimeslotItem = new ServiceProviderTimeslot(spItem, timeslotCapacity.getCapacity());
			this._serviceProviderTimeslots.set(spItem.id, spTimeslotItem);
		}
	}

	public setBookedServiceProviders(bookings: Booking[]) {
		const bookedProviderIds = groupByKey(bookings, (b) => b.serviceProviderId);
		for (const item of bookedProviderIds) {
			const [spId, bookings] = item;
			const spTimeslotItem = this._serviceProviderTimeslots.get(spId);
			if (spTimeslotItem) {
				spTimeslotItem.acceptedBookings = bookings;
			}
		}
	}

	public setOverlappingServiceProviders(providerIds: number[]) {
		providerIds.forEach((id) => {
			const spTimeslotItem = this._serviceProviderTimeslots.get(id);
			if (spTimeslotItem) spTimeslotItem.isOverlapped = true;
		});
	}

	public setUnavailability(unavailability: Unavailability) {
		if (unavailability.allServiceProviders) {
			this._serviceProviderTimeslots.forEach((spTimeslot) => {
				spTimeslot.isUnavailable = true;
			});
		} else {
			unavailability.serviceProviders.forEach((unavailableSp) => {
				const spTimeslotItem = this._serviceProviderTimeslots.get(unavailableSp.id);
				if (spTimeslotItem) spTimeslotItem.isUnavailable = true;
			});
		}
	}

	public setPendingBookings(bookings: Booking[]): void {
		const assignedPendingBookings = bookings.filter((b) => b.serviceProviderId);
		const spWithPendingBooking = groupByKey(assignedPendingBookings, (b) => b.serviceProviderId);

		this._unlinkedPendingBookingsCount = bookings.length - assignedPendingBookings.length;

		for (const item of spWithPendingBooking) {
			const [spid, pendingBookings] = item;
			const spTimeslotItem = this._serviceProviderTimeslots.get(spid);
			if (spTimeslotItem) spTimeslotItem.pendingBookings = pendingBookings;
		}
	}
}
