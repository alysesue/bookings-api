import { Timeslot } from '../../models';
import { TimeslotWithCapacity } from '../../models/timeslotWithCapacity';

const BigIntShift = BigInt(48);
export const generateTimeslotKey = (startTime: Date, endTime: Date): TimeslotKey => {
	// tslint:disable-next-line: no-bitwise
	let value = BigInt(startTime.getTime()) << BigIntShift;
	value = value + BigInt(endTime.getTime());
	return value;
};

export type TimeslotKey = bigint & BigInt;

export const compareEntryFn = <TGroup>(a: AggregatedEntry<TGroup>, b: AggregatedEntry<TGroup>): number => {
	const diffStart = a.getTimeslot().getStartTime().getTime() - b.getTimeslot().getStartTime().getTime();
	if (diffStart !== 0) return diffStart;

	return a.getTimeslot().getEndTime().getTime() - b.getTimeslot().getEndTime().getTime();
};

export class TimeslotAggregator<TGroup> {
	private _map: Map<TimeslotKey, AggregatedEntry<TGroup>>;

	constructor() {
		this._map = new Map<TimeslotKey, AggregatedEntry<TGroup>>();
	}

	private getOrAddEntry(timeslot: Timeslot): AggregatedEntry<TGroup> {
		const key = generateTimeslotKey(timeslot.getStartTime(), timeslot.getEndTime());
		let entry = this._map.get(key);
		if (!entry) {
			entry = new AggregatedEntry(timeslot);
			this._map.set(key, entry);
		}

		return entry;
	}

	public aggregate(group: TGroup, generator: Iterable<TimeslotWithCapacity>): void {
		for (const timeslot of generator) {
			const entry = this.getOrAddEntry(timeslot);
			entry.addGroup(group, timeslot);
		}
	}

	public getEntries(): Map<TimeslotKey, AggregatedEntry<TGroup>> {
		return this._map;
	}
}

export class AggregatedEntry<TGroup> {
	private _timeslot: Timeslot;
	private _groups: Map<TGroup, TimeslotWithCapacity>;

	public getTimeslot = () => this._timeslot;
	public getGroups = (): ReadonlyMap<TGroup, TimeslotWithCapacity> => this._groups;

	constructor(timeslot: Timeslot) {
		this._timeslot = timeslot;
		this._groups = new Map<TGroup, TimeslotWithCapacity>();
	}

	public addGroup(group: TGroup, timeslotDetail: TimeslotWithCapacity): void {
		if (!this._groups.has(group)) {
			this._groups.set(group, timeslotDetail);
		}
	}

	public hasGroup(predicate: (group: TGroup) => boolean): boolean {
		for (const group of this._groups.keys()) {
			if (predicate(group)) {
				return true;
			}
		}
		return false;
	}

	public findGroup(predicate: (group: TGroup) => boolean): [TGroup, TimeslotWithCapacity] {
		for (const value of this._groups) {
			if (predicate(value[0])) {
				return value;
			}
		}
		return undefined;
	}
}
