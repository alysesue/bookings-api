import { Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TimeslotItem } from './timeslotItem';
import { IService, IServiceProvider, ITimeslotsSchedule } from '../interfaces';
import { DateHelper } from '../../infrastructure/dateHelper';
import { groupByKey } from '../../tools/collections';
import { TimeOfDay } from '../timeOfDay';
import { TimeslotWithCapacity } from '../timeslotWithCapacity';

const TIME_PER_DAY = 24 * 60 * 60 * 1000;

@Entity()
export class TimeslotsSchedule implements ITimeslotsSchedule {
	constructor() {}

	@PrimaryGeneratedColumn()
	public _id: number;

	@OneToOne('Service', '_timeslotsSchedule')
	public _service: IService;
	public get service(): IService {
		return this._service;
	}

	@OneToOne('ServiceProvider', '_timeslotsSchedule')
	public _serviceProvider: IServiceProvider;
	public get serviceProvider(): IServiceProvider {
		return this._serviceProvider;
	}

	@OneToMany((type) => TimeslotItem, (timeslot) => timeslot._timeslotsSchedule, {
		cascade: true,
	})
	public timeslotItems: TimeslotItem[];

	public static create(service: IService, serviceProvider: IServiceProvider): TimeslotsSchedule {
		const instance = new TimeslotsSchedule();
		if (service) instance._service = service;
		if (serviceProvider) instance._serviceProvider = serviceProvider;
		return instance;
	}

	public intersectsAnyExceptThis(timeslotItem: TimeslotItem) {
		for (const entry of this.timeslotItems || []) {
			if (entry._id === timeslotItem._id) continue;

			if (entry.intersects(timeslotItem)) return true;
		}
		return false;
	}

	private static sortTimeslots(a: TimeslotItem, b: TimeslotItem) {
		const compare = TimeOfDay.compare(a._startTime, b._startTime);
		if (compare !== 0) {
			return compare;
		}
		return TimeOfDay.compare(a._endTime, b._endTime);
	}

	// tslint:disable-next-line: cognitive-complexity
	public *generateValidTimeslots(range: { startDatetime: Date; endDatetime: Date }): Iterable<TimeslotWithCapacity> {
		if (range.endDatetime < range.startDatetime) {
			return;
		}

		const validWeekDays = groupByKey(this.timeslotItems || [], (t) => t._weekDay);
		for (const [, weekdayTimeslots] of validWeekDays) {
			weekdayTimeslots.sort(TimeslotsSchedule.sortTimeslots);
		}

		const initialDate = DateHelper.getDateOnly(range.startDatetime);
		const daysCount = 1 + Math.floor(DateHelper.DiffInDays(DateHelper.getDateOnly(range.endDatetime), initialDate));
		const lastDayIndex = daysCount - 1;
		const firstDayStartTime = TimeOfDay.fromDate(range.startDatetime);
		const lastDayEndTime = TimeOfDay.fromDate(range.endDatetime);

		let dateNative = initialDate.getTime();
		let dayOfWeek = initialDate.getDay();

		for (let day = 0; day < daysCount; day++) {
			const weekdayTimeslots: TimeslotItem[] = validWeekDays.get(dayOfWeek);

			if (weekdayTimeslots && weekdayTimeslots.length > 0) {
				const startTimeOfDay = day === 0 ? firstDayStartTime : null;
				const endTimeOfDay = day === lastDayIndex ? lastDayEndTime : null;

				for (const timeslotTemplate of weekdayTimeslots) {
					if (startTimeOfDay && TimeOfDay.compare(timeslotTemplate._startTime, startTimeOfDay) < 0) continue;
					if (endTimeOfDay && TimeOfDay.compare(timeslotTemplate._endTime, endTimeOfDay) > 0) continue;

					const timeslot: TimeslotWithCapacity = {
						startTimeNative: dateNative + timeslotTemplate._startTime.AsMilliseconds(),
						endTimeNative: dateNative + timeslotTemplate._endTime.AsMilliseconds(),
						capacity: timeslotTemplate._capacity,
					};

					yield timeslot;
				}
			}

			dateNative = dateNative + TIME_PER_DAY;
			dayOfWeek = (dayOfWeek + 1) % 7;
		}
	}
}
