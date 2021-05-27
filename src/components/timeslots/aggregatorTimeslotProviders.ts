import { TimeslotWithCapacity } from '../../models/timeslotWithCapacity';
import { ServiceProvider } from '../../models';
import { AvailableTimeslotProviders } from './availableTimeslotProviders';
import { generateTimeslotKeyNative, TimeslotMap } from './timeslotAggregator';
import { nextImmediateTick } from '../../infrastructure/immediateHelper';

const MaxLoopIterationCount = 1000;

export class ServiceProvidersLookup {
	private _map: { [key: string]: ServiceProvider };

	public constructor() {
		this._map = {};
	}

	public addMany(providers: Iterable<ServiceProvider>): void {
		for (const provider of providers) {
			this.add(provider);
		}
	}

	public add(provider: ServiceProvider): void {
		if (!this._map[provider.id]) {
			this._map[provider.id] = provider;
		}
	}

	public get(providerId: number | string): ServiceProvider {
		return this._map[providerId];
	}

	public getAll(): Iterable<ServiceProvider> {
		return Object.values(this._map);
	}
}

export class AggregatorTimeslotProviders {
	private _map: TimeslotMap<AvailableTimeslotProviders>;
	private _providerLookup: ServiceProvidersLookup;

	public constructor(providerLookup: ServiceProvidersLookup) {
		this._map = new TimeslotMap<AvailableTimeslotProviders>();
		this._providerLookup = providerLookup;
	}

	private getOrAddEntry(startTime: number, endTime: number): AvailableTimeslotProviders {
		const key = generateTimeslotKeyNative(startTime, endTime);
		let entry = this._map.get(key);
		if (!entry) {
			entry = AvailableTimeslotProviders.empty(this._providerLookup, startTime, endTime);
			this._map.set(key, entry);
		}

		return entry;
	}

	public aggregateTimeslot(provider: ServiceProvider, timeslot: TimeslotWithCapacity): void {
		if (provider.isLicenceExpireNative(timeslot.startTimeNative)) {
			return;
		}

		const entry = this.getOrAddEntry(timeslot.startTimeNative, timeslot.endTimeNative);
		entry.addServiceProvider(provider, timeslot);
	}

	public async aggregate(group: ServiceProvider, generator: Iterable<TimeslotWithCapacity>): Promise<void> {
		let counter = 0;
		for (const timeslot of generator) {
			this.aggregateTimeslot(group, timeslot);

			if (counter++ > MaxLoopIterationCount) {
				counter = 0;
				await nextImmediateTick();
			}
		}
	}

	public getEntries(): TimeslotMap<AvailableTimeslotProviders> {
		return this._map;
	}
}
