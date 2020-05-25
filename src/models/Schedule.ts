import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Weekday } from "../enums/weekday";
import { DateHelper } from '../infrastructure/dateHelper';
import { Timeslot } from './Timeslot';
import { TimeOfDay, Transformer as TimeTransformer } from './TimeOfDay';
import { groupByKeyLastValue } from '../tools/collections';

@Entity()
export class Schedule {
	@PrimaryGeneratedColumn()
	public id: number;

	@Column({ type: "varchar", length: 100 })
	public name: string;

	@Column({ type: "int" })
	public slotsDurationInMin: number;

	@OneToMany(type => WeekDaySchedule, weekdaySchedule => weekdaySchedule.schedule)
	public weekdaySchedules: WeekDaySchedule[];

	constructor() {
	}

	public validateSchedule(): void {
		for (const weekdaySchedule of this.weekdaySchedules) {
			if (weekdaySchedule.schedule !== this) {
				weekdaySchedule.schedule = this;
			}

			weekdaySchedule.validateWeekDaySchedule();
		}
	}

	public * generateValidTimeslots(range: { startDatetime: Date, endDatetime: Date }): Iterable<Timeslot> {
		if (range.endDatetime < range.startDatetime) {
			return;
		}

		const initialDate = DateHelper.getDateOnly(range.startDatetime);
		const daysCount = 1 + Math.floor(DateHelper.DiffInDays(DateHelper.getDateOnly(range.endDatetime), initialDate));

		const validWeekDays = groupByKeyLastValue(this.weekdaySchedules.filter(w => w.hasSchedule), w => w.weekDay);

		for (let day = 0; day < daysCount; day++) {
			const date = DateHelper.addDays(initialDate, day);

			if (!validWeekDays.has(date.getDay())) {
				continue;
			}

			const weekDaySchedule: WeekDaySchedule = validWeekDays[date.getDay()];
			const weekDayRange = {
				startDatetime: range.startDatetime,
				endDatetime: range.endDatetime,
				currentDayOfWeek: date
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
	public hasSchedule: boolean;

	@Column({ type: "time", transformer: TimeTransformer, nullable: true })
	public openTime?: TimeOfDay;

	@Column({ type: "time", transformer: TimeTransformer, nullable: true })
	public closeTime?: TimeOfDay;

	constructor(weekDay: Weekday) {
		this.weekDay = weekDay;
	}

	public validateWeekDaySchedule() {
		if (!this.schedule) {
			throw new Error('Schedule entity not set in WeekDaySchedule');
		}

		if (!this.hasSchedule) {
			return;
		}

		if (!this.openTime || !this.closeTime) {
			throw new Error(`Open and close times must be informed because schedule is enable for this day of the week [${this.weekDay}]`);
		}

		const diff = TimeOfDay.DiffInMinutes(this.closeTime, this.openTime);
		if (diff < 0) {
			throw new Error(`Close time [${this.closeTime}] must be greater than open time [${this.openTime}]`);
		}

		if (diff < this.schedule.slotsDurationInMin) {
			throw new Error(`The interval between open and close times [${this.openTime} — ${this.closeTime}] must be greater that slot duration [${this.schedule.slotsDurationInMin}]`);
		}
	}

	private getRelativeStartTime(startDate: Date): Date {
		return this.openTime.setTimeOfDay(startDate);
	}

	private getRelativeEndTime(endDate: Date): Date {
		return this.closeTime.setTimeOfDay(endDate);
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

	public * generateValidTimeslots(range: { startDatetime: Date, endDatetime: Date, currentDayOfWeek: Date }): Iterable<Timeslot> {
		const isFirstDay = DateHelper.equalsDateOnly(range.startDatetime, range.currentDayOfWeek);
		const isLastDay = DateHelper.equalsDateOnly(range.endDatetime, range.currentDayOfWeek);
		const slotDuration = this.schedule.slotsDurationInMin;

		let startTime = isFirstDay ? this.getFirstBlockStartTime(range.startDatetime) : this.getRelativeStartTime(range.currentDayOfWeek);
		let currentEndTime = DateHelper.addMinutes(startTime, slotDuration);

		const maxLastBlockEndTime = isLastDay ? this.getMaxLastBlockEndTime(range.endDatetime) : this.getRelativeEndTime(range.currentDayOfWeek);

		while (currentEndTime <= maxLastBlockEndTime) {
			yield new Timeslot(startTime, currentEndTime);

			startTime = currentEndTime;
			currentEndTime = DateHelper.addMinutes(currentEndTime, slotDuration);
		}
	}
}
