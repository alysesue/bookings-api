import { AggregatedEntry } from './timeslotAggregator';
import { Booking, ServiceProvider, Unavailability } from '../../models';

export class AvailableTimeslotProviders {
	public startTime: Date;
	public endTime: Date;
	private _pendingBookingsCount: number;

	private _relatedServiceProviders: ServiceProvider[];
	private _bookedServiceProviders: Map<ServiceProvider, Booking[]>;
	private _overlappingServiceProviders: ServiceProvider[];
	private _availableServiceProviders: ServiceProvider[];

	constructor() {
		this._relatedServiceProviders = [];
		this._bookedServiceProviders = new Map<ServiceProvider, Booking[]>();
		this._overlappingServiceProviders = [];
		this._availableServiceProviders = [];
		this._pendingBookingsCount = 0;
	}

	public get bookedServiceProviders(): Map<ServiceProvider, Booking[]> {
		return this._bookedServiceProviders;
	}

	public get availableServiceProviders(): ServiceProvider[] {
		return this._availableServiceProviders;
	}

	public set availableServiceProviders(availableServiceProviders: ServiceProvider[]) {
		this._availableServiceProviders = availableServiceProviders;
	}

	public get pendingBookingsCount(): number {
		return this._pendingBookingsCount;
	}

	public set pendingBookingsCount(value: number) {
		this._pendingBookingsCount = value;
	}

	public get availabilityCount(): number {
		return Math.max(this._availableServiceProviders.length - this._pendingBookingsCount, 0);
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

		instance._relatedServiceProviders = entry
			.getGroups()
			.filter((booking) => booking.serviceProvider)
			.map((booking) => booking.serviceProvider);

		return instance;
	}

	public setRelatedServiceProviders(providers: ServiceProvider[]) {
		this._relatedServiceProviders = providers;
		this._bookedServiceProviders = new Map<ServiceProvider, Booking[]>();
		this._availableServiceProviders = Array.from(providers);
	}

	public setBookedServiceProviders(bookings: Booking[]) {
		const bookedProviderIds = new Set<number>(bookings.map((b) => b.serviceProviderId));

		bookings.forEach((booking) => {
			if (!this._bookedServiceProviders.has(booking.serviceProvider)) {
				this._bookedServiceProviders.set(booking.serviceProvider, []);
			}
			this._bookedServiceProviders.get(booking.serviceProvider).push(booking);
		});

		this._availableServiceProviders = this._availableServiceProviders.filter((sp) => !bookedProviderIds.has(sp.id));
	}

	public setOverlappingServiceProviders(providerIds: number[]) {
		const overlappingProviderIds = new Set<number>(providerIds);
		this._overlappingServiceProviders = this._relatedServiceProviders.filter((sp) =>
			overlappingProviderIds.has(sp.id),
		);
		this._availableServiceProviders = this._availableServiceProviders.filter(
			(sp) => !overlappingProviderIds.has(sp.id),
		);
	}

	public setUnavailability(unavailability: Unavailability) {
		if (unavailability.allServiceProviders) {
			this._availableServiceProviders = [];
		} else {
			const unavailableProviderIds = unavailability.serviceProviders.reduce(
				(set, sp) => set.add(sp.id),
				new Set<number>(),
			);
			this._availableServiceProviders = this._availableServiceProviders.filter(
				(sp) => !unavailableProviderIds.has(sp.id),
			);
		}
	}

	public filterServiceProviders(providerIds: number[]) {
		const providerIdsCollection = new Set<number>(providerIds);

		// availabilityBefore: Does timeslot entry contain less pending bookings then available providers?
		const availabilityCountBefore = this.availabilityCount;

		this._relatedServiceProviders = this._relatedServiceProviders.filter((sp) => providerIdsCollection.has(sp.id));
		this._bookedServiceProviders = new Map(
			Array.from(this._bookedServiceProviders.entries()).filter(([sp]) => providerIdsCollection.has(sp.id)),
		);
		this._overlappingServiceProviders = this._overlappingServiceProviders.filter((sp) =>
			providerIdsCollection.has(sp.id),
		);
		this._availableServiceProviders = this._availableServiceProviders.filter((sp) =>
			providerIdsCollection.has(sp.id),
		);
		const newCapacity = this._availableServiceProviders.length;

		const newAvailabilityCount = Math.min(newCapacity, availabilityCountBefore);
		this.pendingBookingsCount = newCapacity - newAvailabilityCount;
	}
}
