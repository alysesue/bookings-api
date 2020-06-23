import { AggregatedEntry } from "./timeslotAggregator";
import { ServiceProvider } from '../models';

export class AvailableTimeslotProviders {
	public startTime: Date;
	public endTime: Date;
	public pendingBookingsCount: number;
	private _relatedServiceProviders: ServiceProvider[];
	private _bookedServiceProviders: ServiceProvider[];
	private _availableServiceProviders: ServiceProvider[];

	constructor() {
		this._relatedServiceProviders = [];
		this._bookedServiceProviders = [];
		this._availableServiceProviders = [];
		this.pendingBookingsCount = 0;
	}

	public setRelatedServiceProviders(providers: ServiceProvider[]) {
		this._relatedServiceProviders = providers;
		this._bookedServiceProviders = [];
		this._availableServiceProviders = Array.from(providers);
	}

	public setBookedServiceProvders(providerIds: number[]) {
		const bookedProviderIds = new Set<number>(providerIds);
		this._bookedServiceProviders = this._relatedServiceProviders.filter(sp => bookedProviderIds.has(sp.id));
		this._availableServiceProviders = this._relatedServiceProviders.filter(sp => !bookedProviderIds.has(sp.id));
	}

	public get bookedServiceProviders(): ServiceProvider[] {
		return this._bookedServiceProviders;
	}

	public get availableServiceProviders(): ServiceProvider[] {
		return this._availableServiceProviders;
	}

	public get availabilityCount(): number {
		return this._availableServiceProviders.length - this.pendingBookingsCount;
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
		instance.setRelatedServiceProviders(entry.getGroups());

		return instance;
	}
}
