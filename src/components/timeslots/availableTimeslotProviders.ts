import { AggregatedEntry } from './timeslotAggregator';
import { Booking, ServiceProvider, Unavailability } from '../../models';

export class AvailableTimeslotProviders {
	public startTime: Date;
	public endTime: Date;
	public pendingBookingsCount: number;

	private _relatedServiceProviders: ServiceProvider[];
	private _overlappingServiceProviders: ServiceProvider[];

	constructor() {
		this._relatedServiceProviders = [];
		this._bookedServiceProviders = new Map<ServiceProvider, Booking[]>();
		this._overlappingServiceProviders = [];
		this._availableServiceProviders = [];
		this.pendingBookingsCount = 0;
	}

	private _bookedServiceProviders: Map<ServiceProvider, Booking[]>;

	public get bookedServiceProviders(): Map<ServiceProvider, Booking[]> {
		return this._bookedServiceProviders;
	}

	private _availableServiceProviders: ServiceProvider[];

	public get availableServiceProviders(): ServiceProvider[] {
		return this._availableServiceProviders;
	}

	public set availableServiceProviders(availableServiceProviders) {
		this._availableServiceProviders = availableServiceProviders;
	}

	public get availabilityCount(): number {
		return Math.max(this._availableServiceProviders.length - this.pendingBookingsCount, 0);
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

		entry.getGroups().forEach((booking) => {
			if (!instance._bookedServiceProviders.has(booking.serviceProvider)) {
				instance._bookedServiceProviders.set(booking.serviceProvider, []);
			}
			instance._bookedServiceProviders.get(booking.serviceProvider).push(booking);
		});

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

	public keepOnlyServiceProvider(providerId: number) {
		// isAvailableBeforeFilter: Does timeslot entry contain less pending bookings then available providers?
		const isAvailableBeforeFilter = this.availabilityCount > 0;
		this._relatedServiceProviders = this._relatedServiceProviders.filter((sp) => sp.id === providerId);
		this._bookedServiceProviders = new Map(
			Array.from(this._bookedServiceProviders.entries()).filter(([sp]) => sp.id === providerId),
		);
		this._overlappingServiceProviders = this._overlappingServiceProviders.filter((sp) => sp.id === providerId);
		this._availableServiceProviders = this._availableServiceProviders.filter((sp) => sp.id === providerId);
		if (this._availableServiceProviders.length > 0 && isAvailableBeforeFilter) {
			this.pendingBookingsCount = 0;
		}
	}
}
