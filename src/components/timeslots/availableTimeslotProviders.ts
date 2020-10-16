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

	// public get bookedServiceProviders(): Map<ServiceProvider, Booking[]> {
	// 	return this._bookedServiceProviders;
	// }

	// public get availableServiceProviders(): Map<ServiceProvider, number> {
	// 	return this._availableServiceProviders;
	// }

	// public set availableServiceProviders(availableServiceProviders: Map<ServiceProvider, number>) {
	// 	this._availableServiceProviders = availableServiceProviders;
	// }

	// public get unlinkedPendingBookingsCount(): number {
	// 	return this._unlinkedPendingBookingsCount;
	// }

	public get availabilityCount(): number {
		let sumOfAvailability = 0;
		this._serviceProviderTimeslots.forEach(item => {
			sumOfAvailability += item.availabilityCount;
		})
		return Math.max(sumOfAvailability - this._unlinkedPendingBookingsCount, 0);
	}

	public get isValid(): boolean {
		// let sumOfAvailableSp = 0;
		// this._availableServiceProviders.forEach(capacity => sumOfAvailableSp += capacity);
		// return (
		// 	sumOfAvailableSp +
		// 	this._bookedServiceProviders.size +
		// 	this._assignedPendingServiceProviders.size
		// ) > 0;

		let sumOfAvailability = 0;
		this._serviceProviderTimeslots.forEach(item => {
			if (!item.isUnavailable || !item.isOverlapped) {
				sumOfAvailability = sumOfAvailability + (item.availabilityCount - item.acceptedBookings.length - item.pendingBookings.length);
			}
		})

		if (sumOfAvailability > 0) return true;
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
			.filter(booking => booking.serviceProvider)
			.forEach((booking) => {
				const spTimeslotItem = new ServiceProviderTimeslot(booking.serviceProvider, 0);
				instance._serviceProviderTimeslots.set(booking.serviceProviderId, spTimeslotItem);
			})
		// const serviceProviders: [ServiceProvider, number][] = bookings.
		// 	filter((booking) => booking.serviceProvider)
		// 	.map((booking) => [booking.serviceProvider, 0]);
		// instance._relatedServiceProviders = new Map<ServiceProvider, number>(serviceProviders);

		// for (const serviceProvider of serviceProviders) {
		// 	const [sp] = serviceProviders;

		// }
		// instance.setRelatedServiceProviders()
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
			if (spTimeslotItem) spTimeslotItem.acceptedBookings = bookings;
		}
	}

	public setOverlappingServiceProviders(providerIds: number[]) {
		providerIds.forEach(id => {
			const spTimeslotItem = this._serviceProviderTimeslots.get(id);
			if (spTimeslotItem) spTimeslotItem.isOverlapped = true;
		});
	}

	public setUnavailability(unavailability: Unavailability) {
		if (unavailability.allServiceProviders) {
			this._serviceProviderTimeslots.forEach((spTimeslot) => {
				spTimeslot.isUnavailable = true;
			})
		} else {
			unavailability.serviceProviders.forEach((unavailableSp) => {
				const spTimeslotItem = this._serviceProviderTimeslots.get(unavailableSp.id);
				if (spTimeslotItem) spTimeslotItem.isUnavailable = true;
			})
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

	// public filterServiceProviders(providerIds: number[]) {
	// 	const providerIdsCollection = new Set<number>(providerIds);

	// 	// availabilityBefore: Does timeslot entry contain less pending bookings then available providers?
	// 	const availabilityCountBefore = this.availabilityCount;

	// 	this.filterMap(this._relatedServiceProviders, ([sp]) => (providerIdsCollection.has(sp.id)))

	// 	this._bookedServiceProviders = new Map(
	// 		Array.from(this._bookedServiceProviders.entries()).filter(([sp]) => providerIdsCollection.has(sp.id)),
	// 	);
	// 	this._assignedPendingServiceProviders = new Map(
	// 		Array.from(this._assignedPendingServiceProviders.entries()).filter(([sp]) =>
	// 			providerIdsCollection.has(sp.id),
	// 		),
	// 	);
	// 	this.filterMap(this._availableServiceProviders, ([sp]) => (providerIdsCollection.has(sp.id)))
	// 	const newCapacity = this._availableServiceProviders.length;

	// 	const newAvailabilityCount = Math.min(newCapacity, availabilityCountBefore);
	// 	this._unlinkedPendingBookingsCount = newCapacity - newAvailabilityCount;
	// }

	private filterMap<K, V>(data: Map<K, V>, predicate: ([K, V]) => boolean) {
		for (const item of data) {
			const [key] = item
			if (!predicate(item)) {
				data.delete(key);
			}
		}

	}
}
