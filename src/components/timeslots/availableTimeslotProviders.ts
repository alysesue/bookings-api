import { AggregatedEntry } from "./timeslotAggregator";
import { Booking, ServiceProvider, Unavailability } from '../../models';

export class AvailableTimeslotProviders {
	public startTime: Date;
	public endTime: Date;
	public pendingBookingsCount: number;
	public bookings: Booking[];
	private _relatedServiceProviders: ServiceProvider[];
	private _bookedServiceProviders: ServiceProvider[];
	private _overlappingServiceProviders: ServiceProvider[];
	private _availableServiceProviders: ServiceProvider[];

	constructor() {
		this._relatedServiceProviders = [];
		this._bookedServiceProviders = [];
		this._overlappingServiceProviders = [];
		this._availableServiceProviders = [];
		this.pendingBookingsCount = 0;
		this.bookings = [];
	}

	public setRelatedServiceProviders(providers: ServiceProvider[]) {
		this._relatedServiceProviders = providers;
		this._bookedServiceProviders = [];
		this._availableServiceProviders = Array.from(providers);
	}

	public setBookedServiceProviders(providerIds: number[]) {
		const bookedProviderIds = new Set<number>(providerIds);
		this._bookedServiceProviders = this._relatedServiceProviders.filter(sp => bookedProviderIds.has(sp.id));
		this._availableServiceProviders = this._availableServiceProviders.filter(sp => !bookedProviderIds.has(sp.id));
	}

	public setOverlappingServiceProviders(providerIds: number[]) {
		const overlappingProviderIds = new Set<number>(providerIds);
		this._overlappingServiceProviders = this._relatedServiceProviders.filter(sp => overlappingProviderIds.has(sp.id));
		this._availableServiceProviders = this._availableServiceProviders.filter(sp => !overlappingProviderIds.has(sp.id));
	}

	public setUnavailability(unavailability: Unavailability) {
		if (unavailability.allServiceProviders) {
			this._availableServiceProviders = [];
		} else {
			const unavailableProviderIds = unavailability.serviceProviders.reduce((set, sp) => set.add(sp.id), new Set<number>());
			this._availableServiceProviders = this._availableServiceProviders.filter(sp => !unavailableProviderIds.has(sp.id));
		}
	}

	public setBookings(bookings: Booking[]) {
		return this.bookings = bookings;
	}

	public get bookedServiceProviders(): ServiceProvider[] {
		return this._bookedServiceProviders;
	}

	public get availableServiceProviders(): ServiceProvider[] {
		return this._availableServiceProviders;
	}

	public get availabilityCount(): number {
		return Math.max(this._availableServiceProviders.length - this.pendingBookingsCount, 0);
	}

	public keepOnlyServiceProvider(providerId: number) {
		// isAvailableBeforeFilter: Does timeslot entry contain less pending bookings then available providers?
		const isAvailableBeforeFilter = this.availabilityCount > 0;
		this._relatedServiceProviders = this._relatedServiceProviders.filter(sp => sp.id === providerId);
		this._bookedServiceProviders = this._bookedServiceProviders.filter(sp => sp.id === providerId);
		this._overlappingServiceProviders = this._overlappingServiceProviders.filter(sp => sp.id === providerId);
		this._availableServiceProviders = this._availableServiceProviders.filter(sp => sp.id === providerId);
		if (this._availableServiceProviders.length > 0 && isAvailableBeforeFilter) {
			this.pendingBookingsCount = 0;
		}
	}

	public static empty(startTime: Date, endTime: Date): AvailableTimeslotProviders {
		const instance = new AvailableTimeslotProviders();
		instance.startTime = startTime;
		instance.endTime = endTime;

		return instance;
	}

	public static create(entry: AggregatedEntry<ServiceProvider>): AvailableTimeslotProviders {
		const instance = AvailableTimeslotProviders.empty(entry.getTimeslot().getStartTime(), entry.getTimeslot().getEndTime());
		instance.setRelatedServiceProviders(entry.getGroups());

		return instance;
	}

	public static createFromBooking(entry: AggregatedEntry<Booking>): AvailableTimeslotProviders {
		const instance = AvailableTimeslotProviders.empty(entry.getTimeslot().getStartTime(), entry.getTimeslot().getEndTime());

		const serviceProviders = entry.getGroups()
			.filter(booking => booking.serviceProvider)
			.map(booking => booking.serviceProvider);

		instance._relatedServiceProviders = serviceProviders;
		instance._bookedServiceProviders = Array.from(serviceProviders);

		return instance;
	}
}
