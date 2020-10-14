import { Timeslot } from '../../models';
import { TimeslotWithCapacity } from '../../models/timeslotWithCapacity';

export class TimeslotAggregator<TGroup> {
	private _map: any;

	constructor() {
		this._map = {};
	}

	public clear(): void {
		delete this._map;
		this._map = {};
	}

	private compressNumber(n: number): string {
		return n.toString(36);
	}

	private getOrAddEntry(timeslot: Timeslot): AggregatedEntry<TGroup> {
		const startKey = this.compressNumber(timeslot.getStartTime().getTime());
		const endKey = this.compressNumber(timeslot.getEndTime().getTime());
		const key = `${startKey}|${endKey}`;

		let entry = this._map[key];
		if (!entry) {
			entry = new AggregatedEntry(timeslot);
			this._map[key] = entry;
		}

		return entry;
	}

	public aggregate(group: TGroup, generator: Iterable<TimeslotWithCapacity>): void {
		for (const timeslot of generator) {
			const entry = this.getOrAddEntry(timeslot);
			entry.addGroup(group, timeslot.getCapacity());
		}
	}

	private compareEntryFn(a: AggregatedEntry<TGroup>, b: AggregatedEntry<TGroup>): number {
		const diffStart = a.getTimeslot().getStartTime().getTime() - b.getTimeslot().getStartTime().getTime();
		if (diffStart !== 0) return diffStart;

		return a.getTimeslot().getEndTime().getTime() - b.getTimeslot().getEndTime().getTime();
	}

	public getEntries(): AggregatedEntry<TGroup>[] {
		const entries = Object.values<AggregatedEntry<TGroup>>(this._map);
		entries.sort(this.compareEntryFn);
		return entries;
	}
}

export class AggregatedEntry<TGroup> {
	private _timeslot: Timeslot;
	private _groups: Map<TGroup, number>;

	public getTimeslot = () => this._timeslot;
	public getGroups = () => new Map<TGroup, number>(this._groups);

	constructor(timeslot: Timeslot) {
		this._timeslot = timeslot;
		this._groups = new Map<TGroup, number>();
	}

	public addGroup(group: TGroup, capacity: number): void {
		if (!this._groups.has(group)) {
			this._groups.set(group, capacity);
		}

	}

	public findGroup(predicate: (group: TGroup) => boolean): [TGroup, number] {
		for (const value of this._groups) {
			if (predicate(value[0])) { return value };
		}
		return undefined;
	}
}
