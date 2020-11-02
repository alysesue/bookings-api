import { AggregatedEntry } from './timeslotAggregator';
import { Booking, ServiceProvider, Unavailability } from '../../models';
import { groupByKey } from '../../tools/collections';
import { TimeslotServiceProvider, TimeslotServiceProviderResult } from '../../models/timeslotServiceProvider';
import { TimeslotWithCapacity } from '../../models/timeslotWithCapacity';

export class AvailableTimeslotProviders {
	public startTime: Date;
	public endTime: Date;
	private _timeslotServiceProviders: Map<number, TimeslotServiceProvider>;
	private _unassignedPendingBookingCount: number;

	constructor() {
		this._timeslotServiceProviders = new Map<number, TimeslotServiceProvider>();
		this._unassignedPendingBookingCount = 0;
	}

	public get unassignedPendingBookingCount(): number {
		return this._unassignedPendingBookingCount;
	}

	public *getTimeslotServiceProviders(skipUnassigned: boolean = false): Iterable<TimeslotServiceProviderResult> {
		const totalAvailability = this.getInternalAvailabilityCount(skipUnassigned);

		for (const timeslotServiceProvider of this._timeslotServiceProviders.values()) {
			if (timeslotServiceProvider.isVisibleByUser && timeslotServiceProvider.isValid()) {
				yield {
					serviceProvider: timeslotServiceProvider.serviceProvider,
					capacity: timeslotServiceProvider.capacity,
					acceptedBookings: timeslotServiceProvider.acceptedBookings,
					pendingBookings: timeslotServiceProvider.pendingBookings,
					availabilityCount: timeslotServiceProvider.getAvailabilityCount(totalAvailability),
				};
			}
		}
	}

	private getInternalAvailabilityCount(skipUnassigned: boolean = false): number {
		let sumOfAvailability = 0;
		this._timeslotServiceProviders.forEach((item) => {
			sumOfAvailability += item.getAvailabilityCount();
		});
		if (skipUnassigned === true) return Math.max(sumOfAvailability, 0);
		return Math.max(sumOfAvailability - this._unassignedPendingBookingCount, 0);
	}

	public getAvailabilityCount(skipUnassigned: boolean): number {
		const totalAvailability = this.getInternalAvailabilityCount(skipUnassigned);
		let sumAvailabilityVisible = 0;
		for (const timeslotSp of this.getTimeslotServiceProviders(skipUnassigned)) {
			sumAvailabilityVisible += timeslotSp.availabilityCount;
		}
		return Math.min(totalAvailability, sumAvailabilityVisible);
	}

	public isValid(): boolean {
		for (const timeslotSp of this.getTimeslotServiceProviders()) {
			return true;
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
				const spTimeslotItem = new TimeslotServiceProvider(booking.serviceProvider, 0);
				instance._timeslotServiceProviders.set(booking.serviceProviderId, spTimeslotItem);
			});
		return instance;
	}

	public setRelatedServiceProviders(providers: Map<ServiceProvider, TimeslotWithCapacity>) {
		this._timeslotServiceProviders = new Map<number, TimeslotServiceProvider>();
		for (const item of providers) {
			const [spItem, timeslotCapacity] = item;
			const spTimeslotItem = new TimeslotServiceProvider(spItem, timeslotCapacity.getCapacity());
			this._timeslotServiceProviders.set(spItem.id, spTimeslotItem);
		}
	}

	public setBookedServiceProviders(bookings: Booking[]) {
		const bookedProviderIds = groupByKey(bookings, (b) => b.serviceProviderId);
		for (const item of bookedProviderIds) {
			const [spId, spBookings] = item;
			const spTimeslotItem = this._timeslotServiceProviders.get(spId);
			if (spTimeslotItem) {
				spTimeslotItem.acceptedBookings = spBookings;
			}
		}
	}

	public setOverlappingServiceProviders(providerIds: number[]) {
		providerIds.forEach((id) => {
			const spTimeslotItem = this._timeslotServiceProviders.get(id);
			if (spTimeslotItem) spTimeslotItem.isOverlapped = true;
		});
	}

	public setUnavailability(unavailability: Unavailability) {
		if (unavailability.allServiceProviders) {
			this._timeslotServiceProviders.forEach((spTimeslot) => {
				spTimeslot.isUnavailable = true;
			});
		} else {
			unavailability.serviceProviders.forEach((unavailableSp) => {
				const spTimeslotItem = this._timeslotServiceProviders.get(unavailableSp.id);
				if (spTimeslotItem) spTimeslotItem.isUnavailable = true;
			});
		}
	}

	public setPendingBookings(bookings: Booking[]): void {
		const assignedPendingBookings = bookings.filter((b) => b.serviceProviderId);
		const spWithPendingBooking = groupByKey(assignedPendingBookings, (b) => b.serviceProviderId);

		this._unassignedPendingBookingCount = bookings.length - assignedPendingBookings.length;

		for (const item of spWithPendingBooking) {
			const [spid, pendingBookings] = item;
			const spTimeslotItem = this._timeslotServiceProviders.get(spid);
			if (spTimeslotItem) spTimeslotItem.pendingBookings = pendingBookings;
		}
	}

	public setVisibleServiceProviders(providerIds: number[]): void {
		this._timeslotServiceProviders.forEach((item) => (item.isVisibleByUser = false));

		for (const spId of providerIds) {
			const spTimeslotItem = this._timeslotServiceProviders.get(spId);
			if (spTimeslotItem) spTimeslotItem.isVisibleByUser = true;
		}
	}
}
