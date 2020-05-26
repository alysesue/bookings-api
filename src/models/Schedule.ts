import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { getWeekdayName, Weekday } from "../enums/weekday";
import { DateHelper } from '../infrastructure/dateHelper';
import { Timeslot } from './Timeslot';
import { TimeOfDay, Transformer as TimeTransformer } from './TimeOfDay';
import { groupByKeyLastValue } from '../tools/collections';
import { BusinessValidation } from './BusinessValidation';

@Entity()
export class Schedule {
	@PrimaryGeneratedColumn()
	public id: number;

	@Column({ type: "varchar", length: 100 })
	public name: string;

	@Column({ type: "int" })
	public slotsDurationInMin: number;

	@OneToMany(type => WeekDaySchedule, weekdaySchedule => weekdaySchedule.schedule, { cascade: true })
	public weekdaySchedules: WeekDaySchedule[];

	constructor() {
	}

	public * validateSchedule(): Iterable<BusinessValidation> {
		for (const weekdaySchedule of this.weekdaySchedules) {
			if (weekdaySchedule.schedule !== this) {
				weekdaySchedule.schedule = this;
			}

			for (const validation of weekdaySchedule.validateWeekDaySchedule()) {
				yield validation;
			}
		}
	}

	public * generateValidTimeslots(range: { startDatetime: Date, endDatetime: Date }): Iterable<Timeslot> {
		if (range.endDatetime < range.startDatetime) {
			return;
		}

		const initialDate = DateHelper.getDateOnly(range.startDatetime);
		const daysCount = 1 + Math.floor(DateHelper.DiffInDays(DateHelper.getDateOnly(range.endDatetime), initialDate));

		const validWeekDays = groupByKeyLastValue(this.weekdaySchedules.filter(w => w.hasSchedule), w => w.weekDay);
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
				startTimeOfDay: (day === 0) ? firstDayStartTime : null,
				endTimeOfDay: (day === daysCount - 1) ? lastDayEndTime : null,
			};

			for (const timeslot of weekDaySchedule.generateValidTimeslots(weekDayRange)) {
				yield timeslot;
			}
		}
	}
}

@Entity()
@Index(["scheduleId", "weekDay"], { unique: true })
export class WeekDaySchedule {
	@PrimaryGeneratedColumn()
	public id: number;

	@ManyToOne(type => Schedule, { nullable: false })
	@JoinColumn({ name: 'scheduleId' })
	public schedule: Schedule;

	@Column({ nullable: false })
	private scheduleId: number;

	@Column("int")
	public weekDay: Weekday;

	@Column()
	public hasSchedule: boolean;

	@Column({ type: "time", transformer: TimeTransformer, nullable: true })
	public openTime?: TimeOfDay;

	@Column({ type: "time", transformer: TimeTransformer, nullable: true })
	public closeTime?: TimeOfDay;

	constructor(weekDay: Weekday) {
		this.weekDay = weekDay;
		this.hasSchedule = false;
	}

	public * validateWeekDaySchedule(): Iterable<BusinessValidation> {
		if (!this.schedule) {
			throw new Error('Schedule entity not set in WeekDaySchedule');
		}

		if (!this.hasSchedule) {
			return;
		}

		if (!this.openTime || !this.closeTime) {
			yield new BusinessValidation(`Open and close times must be informed because schedule is enabled for this day of the week [${getWeekdayName(this.weekDay)}]`);
			return;
		}

		const diff = TimeOfDay.DiffInMinutes(this.closeTime, this.openTime);
		if (diff < 0) {
			yield new BusinessValidation(`Close time [${this.closeTime}] must be greater than open time [${this.openTime}]`);
			return;
		}

		if (diff < this.schedule.slotsDurationInMin) {
			yield new BusinessValidation(`The interval between open and close times [${this.openTime} — ${this.closeTime}] must be greater that slot duration [${this.schedule.slotsDurationInMin}]`);
			return;
		}
	}

	private getRelativeStartTime(startDate: Date): Date {
		return this.openTime.useTimeOfDay(startDate);
	}

	private getRelativeEndTime(endDate: Date): Date {
		return this.closeTime.useTimeOfDay(endDate);
	}

	private getFirstBlockStartTime(startDatetime: Date): Date {
		let relativeStartDatetime = this.getRelativeStartTime(startDatetime);
		const slotDuration = this.schedule.slotsDurationInMin;

		if (relativeStartDatetime < startDatetime) {
			const minutes = DateHelper.DiffInMinutes(startDatetime, relativeStartDatetime);
			const blocksInDiff = Math.floor(minutes / slotDuration);

			// finds the first block's start time that is after startDatetime, also respecting slot duration
			relativeStartDatetime = DateHelper.addMinutes(relativeStartDatetime, (1 + blocksInDiff) * slotDuration);
		}

		return relativeStartDatetime;
	}

	private getMaxLastBlockEndTime(endDateTime: Date) {
		let relativeEndDatetime = this.getRelativeEndTime(endDateTime);

		if (relativeEndDatetime > endDateTime) {
			relativeEndDatetime = endDateTime;
		}

		return relativeEndDatetime;
	}

	public * generateValidTimeslots(range: { dayOfWeek: Date, startTimeOfDay?: TimeOfDay, endTimeOfDay?: TimeOfDay }): Iterable<Timeslot> {
		if (!this.hasSchedule) {
			return;
		}

		const slotDuration = this.schedule.slotsDurationInMin;

		let startTime = range.startTimeOfDay ? this.getFirstBlockStartTime(range.startTimeOfDay.useTimeOfDay(range.dayOfWeek))
			: this.getRelativeStartTime(range.dayOfWeek);
		let currentEndTime = DateHelper.addMinutes(startTime, slotDuration);

		const maxLastBlockEndTime = range.endTimeOfDay ? this.getMaxLastBlockEndTime(range.endTimeOfDay.useTimeOfDay(range.dayOfWeek))
			: this.getRelativeEndTime(range.dayOfWeek);

		while (currentEndTime <= maxLastBlockEndTime) {
			yield new Timeslot(startTime, currentEndTime);

			startTime = currentEndTime;
			currentEndTime = DateHelper.addMinutes(currentEndTime, slotDuration);
		}
	}
}
