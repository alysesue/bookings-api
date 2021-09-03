import { DateHelper } from '../infrastructure/dateHelper';
import { groupByKey } from '../tools/collections';
import { TimeslotItem } from './entities';
import { TimeOfDay } from './timeOfDay';
import { TimeslotWithCapacity } from './timeslotWithCapacity';

const TIME_PER_DAY = 24 * 60 * 60 * 1000;

export class TimeslotGenerator {
	readonly _timeslotItems: TimeslotItem[];

	public constructor(timeslotItems: TimeslotItem[]) {
		this._timeslotItems = timeslotItems || [];
	}

	private static sortTimeslots(a: TimeslotItem, b: TimeslotItem) {
		const compare = TimeOfDay.compare(a._startTime, b._startTime);
		if (compare !== 0) {
			return compare;
		}
		return TimeOfDay.compare(a._endTime, b._endTime);
	}

	public *generateValidTimeslots(range: { startDatetime: Date; endDatetime: Date }): Iterable<TimeslotWithCapacity> {
		if (range.endDatetime < range.startDatetime) {
			return;
		}

		const validWeekDays = groupByKey(this._timeslotItems, (t) => t._weekDay);
		for (const [, weekdayTimeslots] of validWeekDays) {
			weekdayTimeslots.sort(TimeslotGenerator.sortTimeslots);
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
					const startTimeNative = dateNative + timeslotTemplate._startTime.AsMilliseconds();
					const endTimeNative = dateNative + timeslotTemplate._endTime.AsMilliseconds();
					if (
						(timeslotTemplate._startDate &&
							startTimeNative < DateHelper.getStartOfDayNative(timeslotTemplate._startDate.getTime())) ||
						(timeslotTemplate._endDate &&
							endTimeNative > DateHelper.getEndOfDayNative(timeslotTemplate._endDate.getTime()))
					)
						continue;
					const timeslot: TimeslotWithCapacity = {
						startTimeNative,
						endTimeNative,
						capacity: timeslotTemplate._capacity,
						isRecurring: true,
					};

					yield timeslot;
				}
			}
			dateNative = dateNative + TIME_PER_DAY;
			dayOfWeek = (dayOfWeek + 1) % 7;
		}
	}
}
