import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DateHelper } from '../../infrastructure/dateHelper';
import { Timeslot } from '../timeslot';
import { TimeOfDay } from '../timeOfDay';
import { groupByKey, groupByKeyLastValue } from '../../tools/collections';
import { BusinessValidation } from '../businessValidation';
import { WeekdayList } from '../../enums/weekday';
import { IScheduleForm } from '../interfaces';
import { WeekDayBreak } from './weekDayBreak';
import { WeekDaySchedule } from './weekDaySchedule';

@Entity()
export class ScheduleForm implements IScheduleForm {
	@PrimaryGeneratedColumn()
	public id: number;

	@Column({ type: 'varchar', length: 100 })
	public name: string;

	@Column({ type: 'int' })
	public slotsDurationInMin: number;

	@OneToMany((type) => WeekDaySchedule, (weekdaySchedule) => weekdaySchedule.scheduleForm, { cascade: true })
	public weekdaySchedules: WeekDaySchedule[];

	constructor() {}

	public initWeekdaySchedules(): void {
		if (!this.weekdaySchedules || this.weekdaySchedules.length === 0) {
			this.weekdaySchedules = WeekdayList.map((day) => WeekDaySchedule.create(day, this));
		} else {
			this.ensureWeekdayParentIsSet();
		}
	}

	public verifyWeekdaySchedules() {
		if (!this.weekdaySchedules || this.weekdaySchedules.length === 0) {
			throw new Error('Week day schedules not loaded.');
		}
	}

	public setBreaks(breaks: WeekDayBreak[]): void {
		this.verifyWeekdaySchedules();
		breaks.filter((e) => e.scheduleForm !== this).forEach((e) => (e.scheduleForm = this));

		const breaksByWeekday = groupByKey(breaks, (e) => e.weekDay);
		for (const daySchedule of this.weekdaySchedules) {
			daySchedule.breaks = breaksByWeekday.get(daySchedule.weekDay) || [];
		}
	}

	public getAllBreaks(): WeekDayBreak[] {
		this.verifyWeekdaySchedules();
		const breaks: WeekDayBreak[] = [];

		for (const daySchedule of this.weekdaySchedules) {
			if (daySchedule.breaks) {
				breaks.push(...daySchedule.breaks);
			}
		}

		return breaks;
	}

	public *validateSchedule(): Iterable<BusinessValidation> {
		this.ensureWeekdayParentIsSet();
		for (const weekdaySchedule of this.weekdaySchedules) {
			for (const validation of weekdaySchedule.validateWeekDaySchedule()) {
				yield validation;
			}
		}
	}

	public *generateValidTimeslots(range: { startDatetime: Date; endDatetime: Date }): Iterable<Timeslot> {
		this.ensureWeekdayParentIsSet();
		if (range.endDatetime < range.startDatetime) {
			return;
		}

		const initialDate = DateHelper.getDateOnly(range.startDatetime);
		const daysCount = 1 + Math.floor(DateHelper.DiffInDays(DateHelper.getDateOnly(range.endDatetime), initialDate));

		const validWeekDays = groupByKeyLastValue(
			this.weekdaySchedules.filter((w) => w.hasScheduleForm),
			(w) => w.weekDay,
		);
		const firstDayStartTime = TimeOfDay.fromDate(range.startDatetime);
		const lastDayEndTime = TimeOfDay.fromDate(range.endDatetime);

		for (let day = 0; day < daysCount; day++) {
			const date = DateHelper.addDays(initialDate, day);
			const weekDaySchedule: WeekDaySchedule = validWeekDays.get(date.getDay());

			if (!weekDaySchedule) {
				continue;
			}

			const weekDayRange = {
				dayOfWeek: date,
				startTimeOfDay: day === 0 ? firstDayStartTime : null,
				endTimeOfDay: day === daysCount - 1 ? lastDayEndTime : null,
			};

			for (const timeslot of weekDaySchedule.generateValidTimeslots(weekDayRange)) {
				yield timeslot;
			}
		}
	}

	private ensureWeekdayParentIsSet(): void {
		this.verifyWeekdaySchedules();
		this.weekdaySchedules.filter((e) => e.scheduleForm !== this).forEach((e) => (e.scheduleForm = this));
	}
}
