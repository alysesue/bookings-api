import { AggregatedEntry } from './timeslotAggregator';
import { Booking, ServiceProvider, Unavailability } from '../../models';
import { groupByKey } from '../../tools/collections';
import { TimeslotServiceProvider, TimeslotServiceProviderResult } from '../../models/timeslotServiceProvider';
import { TimeslotWithCapacity } from '../../models/timeslotWithCapacity';

export class AvailableTimeslotProviders {
	public startTime: number;
	public endTime: number;
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
		const totalAvailability = skipUnassigned ? undefined : this.getInternalAvailabilityCount();

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

	private getInternalAvailabilityCount(): number {
		let sumOfAvailability = 0;
		this._timeslotServiceProviders.forEach((item) => {
			sumOfAvailability += item.getAvailabilityCount();
		});
		return Math.max(sumOfAvailability - this._unassignedPendingBookingCount, 0);
	}

	public getAvailabilityCount(): number {
		const totalAvailability = this.getInternalAvailabilityCount();
		let sumAvailabilityVisible = 0;
		for (const timeslotSp of this.getTimeslotServiceProviders()) {
			sumAvailabilityVisible += timeslotSp.availabilityCount;
		}
		return Math.min(totalAvailability, sumAvailabilityVisible);
	}

	public isValidAndVisible(): boolean {
		for (const _timeslotSp of this.getTimeslotServiceProviders()) {
			return true;
		}
		return false;
	}

	public static empty(startTime: number, endTime: number): AvailableTimeslotProviders {
		const instance = new AvailableTimeslotProviders();
		instance.startTime = startTime;
		instance.endTime = endTime;
		return instance;
	}

	public static create(entry: AggregatedEntry<ServiceProvider>): AvailableTimeslotProviders {
		const instance = AvailableTimeslotProviders.empty(
			entry.getTimeslot().startTimeNative,
			entry.getTimeslot().endTimeNative,
		);
		instance.setRelatedServiceProviders(entry.getGroups());
		return instance;
	}

	public setRelatedServiceProviders(providers: ReadonlyMap<ServiceProvider, TimeslotWithCapacity>) {
		this._timeslotServiceProviders = new Map<number, TimeslotServiceProvider>();
		for (const item of providers) {
			const [spItem, timeslotCapacity] = item;
			const spTimeslotItem = new TimeslotServiceProvider(spItem, timeslotCapacity.capacity);
			if (!spTimeslotItem.serviceProvider.isLicenceExpireNative(timeslotCapacity.startTimeNative))
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
			} else {
				const newTimeslotItem = new TimeslotServiceProvider(spBookings[0].serviceProvider, 0);
				newTimeslotItem.acceptedBookings = spBookings;
				this._timeslotServiceProviders.set(spId, newTimeslotItem);
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
