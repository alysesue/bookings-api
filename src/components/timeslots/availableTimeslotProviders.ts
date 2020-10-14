import { AggregatedEntry } from './timeslotAggregator';
import { Booking, ServiceProvider, Unavailability } from '../../models';
import { groupByKey } from '../../tools/collections';
import { ServiceProviderTimeslot } from '../../models/serviceProviderTimeslot';

export class AvailableTimeslotProviders {
	public startTime: Date;
	public endTime: Date;
	private _serviceProviderTimeslots: Map<ServiceProvider, ServiceProviderTimeslot>;
	private _unlinkedPendingBookingsCount: number;

	private _relatedServiceProviders: Map<ServiceProvider, number>;
	private _bookedServiceProviders: Map<ServiceProvider, Booking[]>;
	private _assignedPendingServiceProviders: Map<ServiceProvider, Booking[]>;
	private _availableServiceProviders: Map<ServiceProvider, number>;

	constructor() {
		this._relatedServiceProviders = new Map<ServiceProvider, number>();
		this._bookedServiceProviders = new Map<ServiceProvider, Booking[]>();
		this._assignedPendingServiceProviders = new Map<ServiceProvider, Booking[]>();
		this._availableServiceProviders = new Map<ServiceProvider, number>();
		this._unlinkedPendingBookingsCount = 0;
	}

	public get bookedServiceProviders(): Map<ServiceProvider, Booking[]> {
		return this._bookedServiceProviders;
	}

	public get availableServiceProviders(): Map<ServiceProvider, number> {
		return this._availableServiceProviders;
	}

	public set availableServiceProviders(availableServiceProviders: Map<ServiceProvider, number>) {
		this._availableServiceProviders = availableServiceProviders;
	}

	public get unlinkedPendingBookingsCount(): number {
		return this._unlinkedPendingBookingsCount;
	}

	public get availabilityCount(): number {
		let sumOfAvailableSp = 0;
		this._availableServiceProviders.forEach(capacity => sumOfAvailableSp += capacity);
		return Math.max(sumOfAvailableSp - this._unlinkedPendingBookingsCount, 0);
	}

	public get totalCount(): number {
		let sumOfAvailableSp = 0;
		this._availableServiceProviders.forEach(capacity => sumOfAvailableSp += capacity);
		return (
			sumOfAvailableSp +
			this._bookedServiceProviders.size +
			this._assignedPendingServiceProviders.size
		);
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
		const serviceProviders: [ServiceProvider, number][] = bookings.
			filter((booking) => booking.serviceProvider)
			.map((booking) => [booking.serviceProvider, 0]);
		instance._relatedServiceProviders = new Map<ServiceProvider, number>(serviceProviders);
		return instance;
	}

	public setRelatedServiceProviders(providers: Map<ServiceProvider, number>) {

		this._relatedServiceProviders = providers;
		this._bookedServiceProviders = new Map<ServiceProvider, Booking[]>();
		this._availableServiceProviders = new Map<ServiceProvider, number>(providers)
	}

	public setBookedServiceProviders(bookings: Booking[]) {
		const bookedProviderIds = groupByKey(bookings, (b) => b.serviceProviderId);
		this._bookedServiceProviders = groupByKey(bookings, (b) => b.serviceProvider);

		for (const [serviceProvider, availability] of this._availableServiceProviders) {
			const bookings = bookedProviderIds.get(serviceProvider.id);
			const totalAvailability = Math.max(availability - (bookings?.length || 0), 0);
			this._availableServiceProviders.set(serviceProvider, totalAvailability);
		}
	}

	public setOverlappingServiceProviders(providerIds: number[]) {
		const overlappingProviderIds = new Set<number>(providerIds);
		this.filterMap(this._availableServiceProviders,
			([serviceProvider]) => (!overlappingProviderIds.has(serviceProvider.id)))

	}

	public setUnavailability(unavailability: Unavailability) {
		if (unavailability.allServiceProviders) {
			this._availableServiceProviders = new Map<ServiceProvider, number>();
		} else {
			const unavailableProviderIds = unavailability.serviceProviders.reduce(
				(set, sp) => set.add(sp.id),
				new Set<number>(),
			);
			this.filterMap(this._availableServiceProviders,
				([serviceProvider]) => (!unavailableProviderIds.has(serviceProvider.id)))
		}
	}

	public setPendingBookings(bookings: Booking[]): void {
		const assignedPendingBookings = bookings.filter((b) => b.serviceProviderId);
		const assignedPendingProviderIds = groupByKey(assignedPendingBookings, (b) => b.serviceProviderId);

		this._assignedPendingServiceProviders = groupByKey(assignedPendingBookings, (b) => b.serviceProvider);

		for (const [serviceProvider, availability] of this._availableServiceProviders) {
			const bookings = assignedPendingProviderIds.get(serviceProvider.id);
			const totalAvailability = Math.max(availability - (bookings?.length || 0), 0);
			this._availableServiceProviders.set(serviceProvider, totalAvailability);
		}
		this._unlinkedPendingBookingsCount = bookings.length - assignedPendingBookings.length;
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
