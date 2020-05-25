import { parseHHmm } from '../tools/date';
import { DateHelper } from '../infrastructure/dateHelper';
import { ValueTransformer } from 'typeorm';

export class TimeOfDay {
	private _hours: number;
	private _minutes: number;

	private constructor() {
	}

	public get hours(): number {
		return this._hours;
	}

	public get minutes(): number {
		return this._minutes;
	}

	public static parse(time: string): TimeOfDay {
		const parsedTime = parseHHmm(time);
		return TimeOfDay.create(parsedTime);
	}

	public static create(time: { hours: number, minutes: number }): TimeOfDay {
		if (!time) {
			return null;
		}

		if (time.hours < 0 || time.hours > 23)
			throw new Error(`Invalid hours value: ${time.hours}`);
		if (time.minutes < 0 || time.minutes > 59)
			throw new Error(`Invalid minutes value: ${time.minutes}`);

		const instance = new TimeOfDay();
		instance._hours = time.hours;
		instance._minutes = time.minutes;
		return instance;
	}

	public toJSON(): string {
		const hours = `${this._hours}`.padStart(2, '0');
		const minutes = `${this._minutes}`.padStart(2, '0');
		return `${hours}:${minutes}`;
	}

	public setTimeOfDay(date: Date): Date {
		const newDate = DateHelper.getDateOnly(date);
		newDate.setHours(this._hours, this._minutes);
		return newDate;
	}

	public AsMinutes(): number { return this._hours * 60 + this._minutes; }

	public static DiffInMinutes(a: TimeOfDay, b: TimeOfDay): number {
		return a.AsMinutes() - b.AsMinutes();
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
