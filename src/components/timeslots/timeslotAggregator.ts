import { Timeslot } from '../../models';

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

	public aggregate(group: TGroup, generator: Iterable<Timeslot>): void {
		for (const timeslot of generator) {
			const entry = this.getOrAddEntry(timeslot);
			entry.addGroup(group);
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
	private _groups: Set<TGroup>;

	public getTimeslot = () => this._timeslot;
	public getGroups = () => [...this._groups];

	constructor(timeslot: Timeslot) {
		this._timeslot = timeslot;
		this._groups = new Set<TGroup>();
	}

	public addGroup(group: TGroup): void {
		if (!this._groups.has(group)) {
			this._groups.add(group);
		}
	}
}
