import { Timeslot } from '../models/templateTimeslots';

export class TimeslotAggregator<TGroup> {
	private _map: Map<string, AggregatedEntry<TGroup>>;

	constructor() {
		this._map = new Map<string, AggregatedEntry<TGroup>>();
	}

	public clear(): void {
		this._map.clear();
	}

	private compressNumber(n: number): string {
		return atob(n.toString(36));
	}

	private getOrAddEntry(timeslot: Timeslot): AggregatedEntry<TGroup> {
		const startKey = this.compressNumber(timeslot.getStartTime().getTime());
		const endKey = this.compressNumber(timeslot.getEndTime().getTime());
		const key = `${startKey}|${endKey}`;

		let entry = this._map.get(key);
		if (!entry) {
			entry = new AggregatedEntry(timeslot);
			this._map.set(key, entry);
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
		if (diffStart !== 0)
			return diffStart;

		return a.getTimeslot().getEndTime().getTime() - b.getTimeslot().getEndTime().getTime();
	}

	public getEntries(): AggregatedEntry<TGroup>[] {
		const entries = Array.from(this._map.values());
		entries.sort(this.compareEntryFn);
		return entries;
	}
}

export class AggregatedEntry<TGroup> {
	private _timeslot: Timeslot;
	private _groups: TGroup[];

	public getTimeslot = () => this._timeslot;
	public getGroupIds = () => this._groups;

	constructor(timeslot: Timeslot) {
		this._timeslot = timeslot;
		this._groups = [];
	}

	public addGroup(group: TGroup): void {
		this._groups = [...this._groups, group];
	}
}
