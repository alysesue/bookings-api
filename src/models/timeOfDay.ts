import { ValueTransformer } from 'typeorm';
import { parseHHmm } from '../tools/date';
import { DateHelper } from '../infrastructure/dateHelper';

export class TimeOfDay {
	private static _cache: { [key: string]: Readonly<TimeOfDay> } = {};

	private static getFromCache(time: string): Readonly<TimeOfDay> {
		if (!time) return null;

		let instance = TimeOfDay._cache[time];
		if (!instance) {
			const parsedTime = parseHHmm(time);
			instance = Object.freeze(TimeOfDay.create(parsedTime));
			TimeOfDay._cache[time] = instance;
		}
		return instance;
	}

	private constructor(hours: number, minutes: number) {
		this._hours = hours;
		this._minutes = minutes;
		this._asMinutes = this._hours * 60 + this._minutes;
		this._asMilliseconds = this._asMinutes * 60 * 1000;
	}

	private readonly _hours: number;
	public get hours(): number {
		return this._hours;
	}

	private readonly _minutes: number;
	public get minutes(): number {
		return this._minutes;
	}

	private _asMinutes: number;
	private _asMilliseconds: number;

	public addMinutes(numOfMinutes: number): TimeOfDay {
		const minutes = this.AsMinutes() + numOfMinutes;
		return TimeOfDay.minutesToTimeOfDay(minutes);
	}

	public static minutesToTimeOfDay(minutesEntry: number): TimeOfDay {
		const hours = Math.trunc(minutesEntry / 60) % 24;
		const minutes = minutesEntry % 60;
		return TimeOfDay.create({ hours, minutes });
	}

	public static parse(time: string): TimeOfDay {
		return TimeOfDay.getFromCache(time) as TimeOfDay;
	}

	public static create(time: { hours: number; minutes: number }): TimeOfDay {
		if (!time) {
			return null;
		}

		if (time.hours < 0 || time.hours > 23) throw new Error(`Invalid hours value: ${time.hours}`);
		if (time.minutes < 0 || time.minutes > 59) throw new Error(`Invalid minutes value: ${time.minutes}`);

		return new TimeOfDay(time.hours, time.minutes);
	}

	public static fromDate(date: Date): TimeOfDay {
		if (!date) {
			return null;
		}

		return new TimeOfDay(date.getHours(), date.getMinutes());
	}

	public static compare(a: TimeOfDay, b: TimeOfDay): number {
		const diffHours = a._hours - b._hours;
		if (diffHours !== 0) {
			return diffHours;
		}
		return a._minutes - b._minutes;
	}

	public static DiffInMinutes(a: TimeOfDay, b: TimeOfDay): number {
		return a.AsMinutes() - b.AsMinutes();
	}

	public toString(): string {
		const hours = `${this._hours}`.padStart(2, '0');
		const minutes = `${this._minutes}`.padStart(2, '0');
		return `${hours}:${minutes}`;
	}

	public toJSON(): string {
		return this.toString();
	}

	public useTimeOfDay(date: Date): Date {
		return DateHelper.setHours(date, this._hours, this._minutes);
	}

	public AsMinutes(): number {
		return this._asMinutes;
	}

	public AsMilliseconds(): number {
		return this._asMilliseconds;
	}
}

class TimeOfDayTransformer implements ValueTransformer {
	public to(value: any) {
		return value?.toJSON() || null;
	}

	public from(value: any) {
		return TimeOfDay.parse(value);
	}
}

export const Transformer = new TimeOfDayTransformer();
