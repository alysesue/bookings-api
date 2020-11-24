import { nextImmediateTick } from '../../infrastructure/immediateHelper';
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
	const diffStart = a.getTimeslot().startTime.getTime() - b.getTimeslot().startTime.getTime();
	if (diffStart !== 0) return diffStart;

	return a.getTimeslot().endTime.getTime() - b.getTimeslot().endTime.getTime();
};

export declare type EntryConstructorType<T> = (new (timeslot: Timeslot) => T) & Function;

export class TimeslotAggregator<TGroup, TEntry extends IAggregatedEntry<TGroup>> {
	private _map: Map<TimeslotKey, TEntry>;
	private _constructor: EntryConstructorType<TEntry>;

	private constructor(constructor: EntryConstructorType<TEntry>) {
		this._map = new Map<TimeslotKey, TEntry>();
		this._constructor = constructor;
	}

	public static create<TGroup>(): TimeslotAggregator<TGroup, AggregatedEntry<TGroup>> {
		return new TimeslotAggregator<TGroup, AggregatedEntry<TGroup>>(AggregatedEntry);
	}

	public static createCustom<TGroup, TEntry extends IAggregatedEntry<TGroup>>(
		constructor: EntryConstructorType<TEntry>,
	) {
		return new TimeslotAggregator<TGroup, TEntry>(constructor);
	}

	private getOrAddEntry(timeslot: Timeslot): TEntry {
		const key = generateTimeslotKey(timeslot.startTime, timeslot.endTime);
		let entry = this._map.get(key);
		if (!entry) {
			entry = new this._constructor(timeslot);
			this._map.set(key, entry);
		}

		return entry;
	}

	public async aggregate(group: TGroup, generator: Iterable<TimeslotWithCapacity>): Promise<void> {
		let counter = 0;
		for (const timeslot of generator) {
			const entry = this.getOrAddEntry(timeslot);
			entry.addGroup(group, timeslot);
			if (counter++ > 1000) {
				counter = 0;
				await nextImmediateTick();
			}
		}
	}

	public getEntries(): Map<TimeslotKey, TEntry> {
		return this._map;
	}
}

export interface IAggregatedEntry<TGroup> {
	getTimeslot(): Timeslot;
	getGroups(): ReadonlyMap<TGroup, TimeslotWithCapacity>;
	addGroup(group: TGroup, timeslotDetail: TimeslotWithCapacity): void;
}

export class AggregatedEntry<TGroup> implements IAggregatedEntry<TGroup> {
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
}

export class AggregatedEntryId<TGroup extends { id: number }> extends AggregatedEntry<TGroup> {
	private _ids: Set<number>;

	constructor(timeslot: Timeslot) {
		super(timeslot);
		this._ids = new Set<number>();
	}

	public addGroup(group: TGroup, timeslotDetail: TimeslotWithCapacity): void {
		if (!this._ids.has(group.id)) {
			this._ids.add(group.id);
			super.addGroup(group, timeslotDetail);
		}
	}

	public hasGroupId(id: number) {
		return this._ids.has(id);
	}
}
