// tslint:disable: no-bitwise
import { nextImmediateTick } from '../../infrastructure/immediateHelper';
import { Timeslot } from '../../models';
import { TimeslotWithCapacity } from '../../models/timeslotWithCapacity';

export const generateTimeslotKey = (startTime: Date, endTime: Date): TimeslotKey =>
	generateTimeslotKeyNative(startTime.getTime(), endTime.getTime());

export const generateTimeslotKeyNative = (startTime: number, endTime: number): TimeslotKey =>
	`${startTime}|${endTime}` as TimeslotKey;

export type TimeslotKey = string & { _timeslotKeyType: never };

export declare type EntryConstructorType<T> = (new (timeslot: Timeslot) => T) & Function;

export const compareEntryFn = <TGroup>(a: AggregatedEntry<TGroup>, b: AggregatedEntry<TGroup>): number => {
	const diffStart = a.getTimeslot().startTimeNative - b.getTimeslot().startTimeNative;
	if (diffStart !== 0) return diffStart;

	return a.getTimeslot().endTimeNative - b.getTimeslot().endTimeNative;
};

export class TimeslotMap<TEntry> extends Map<TimeslotKey, TEntry> {}

const MaxLoopIterationCount = 1000;
export class TimeslotAggregator<TGroup, TEntry extends IAggregatedEntry<TGroup>> {
	private _map: TimeslotMap<TEntry>;
	private _constructor: EntryConstructorType<TEntry>;

	private constructor(constructor: EntryConstructorType<TEntry>) {
		this._map = new TimeslotMap<TEntry>();
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
		const key = generateTimeslotKeyNative(timeslot.startTimeNative, timeslot.endTimeNative);
		let entry = this._map.get(key);
		if (!entry) {
			entry = new this._constructor(timeslot);
			this._map.set(key, entry);
		}

		return entry;
	}

	public aggregateTimeslot(group: TGroup, timeslot: TimeslotWithCapacity): void {
		const entry = this.getOrAddEntry(timeslot);
		entry.addGroup(group, timeslot);
	}

	public async aggregate(group: TGroup, generator: Iterable<TimeslotWithCapacity>): Promise<void> {
		let counter = 0;
		for (const timeslot of generator) {
			this.aggregateTimeslot(group, timeslot);

			if (counter++ > MaxLoopIterationCount) {
				counter = 0;
				await nextImmediateTick();
			}
		}
	}

	public getEntries(): TimeslotMap<TEntry> {
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
