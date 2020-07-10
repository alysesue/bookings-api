import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TimeslotItem } from "./timeslotItem";
import { IService, IServiceProvider, ITimeslotsSchedule } from "../interfaces";
import { DateHelper } from "../../infrastructure/dateHelper";
import { groupByKey } from "../../tools/collections";
import { TimeOfDay } from "../timeOfDay";
import { Timeslot } from "../timeslot";

@Entity()
export class TimeslotsSchedule implements ITimeslotsSchedule {
	constructor() {
	}

	@PrimaryGeneratedColumn()
	public _id: number;

	public _service: IService;
	public get service(): IService {
		return this._service;
	}

	public _serviceProvider: IServiceProvider;
	public get serviceProvider(): IServiceProvider {
		return this._serviceProvider;
	}

	@OneToMany(type => TimeslotItem, timeslot => timeslot._timeslotsSchedule)
	public timeslotItems: TimeslotItem[];

	public static create(serviceId, serviceProviderId): TimeslotsSchedule {
		const instance = new TimeslotsSchedule();
		instance._service = serviceId;
		instance._serviceProvider = serviceProviderId;
		return instance;
	}

	private static sortTimeslots(a: TimeslotItem, b: TimeslotItem) {
		const compare = TimeOfDay.compare(a._startTime, b._startTime);
		if (compare !== 0) {
			return compare;
		}
		return TimeOfDay.compare(a._endTime, b._endTime);
	}

	public * generateValidTimeslots(range: { startDatetime: Date, endDatetime: Date }): Iterable<Timeslot> {
		if (range.endDatetime < range.startDatetime) {
			return;
		}

		const initialDate = DateHelper.getDateOnly(range.startDatetime);
		const daysCount = 1 + Math.floor(DateHelper.DiffInDays(DateHelper.getDateOnly(range.endDatetime), initialDate));

		const validWeekDays = groupByKey(this.timeslotItems, t => t._weekDay);
		for (const [, weekdayTimeslots] of validWeekDays) {
			weekdayTimeslots.sort(TimeslotsSchedule.sortTimeslots);
		}

		const firstDayStartTime = TimeOfDay.fromDate(range.startDatetime);
		const lastDayEndTime = TimeOfDay.fromDate(range.endDatetime);

		for (let day = 0; day < daysCount; day++) {
			const date = DateHelper.addDays(initialDate, day);
			const weekdayTimeslots: TimeslotItem[] = validWeekDays.get(date.getDay());

			if (!weekdayTimeslots || weekdayTimeslots.length === 0) {
				continue;
			}

			const weekDayRange = {
				dayOfWeek: date,
				startTimeOfDay: (day === 0) ? firstDayStartTime : null,
				endTimeOfDay: (day === daysCount - 1) ? lastDayEndTime : null,
			};

			for (const timeslot of this.generateWeekdayValidTimeslots(weekdayTimeslots, weekDayRange)) {
				yield timeslot;
			}
		}
	}

	private * generateWeekdayValidTimeslots(weekdayTimeslots: TimeslotItem[], range: { dayOfWeek: Date, startTimeOfDay?: TimeOfDay, endTimeOfDay?: TimeOfDay }): Iterable<Timeslot> {
		for (const timeslotTemplate of weekdayTimeslots) {
			if (range.startTimeOfDay && TimeOfDay.compare(timeslotTemplate._startTime, range.startTimeOfDay) < 0) continue;
			if (range.endTimeOfDay && TimeOfDay.compare(timeslotTemplate._endTime, range.endTimeOfDay) > 0) continue;

			yield new Timeslot(timeslotTemplate._startTime.useTimeOfDay(range.dayOfWeek),
				timeslotTemplate._endTime.useTimeOfDay(range.dayOfWeek));
		}
	}
}
