import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { getWeekdayName, Weekday } from "../enums/weekday";
import { DateHelper } from '../infrastructure/dateHelper';
import { Timeslot } from './timeslot';
import { TimeOfDay, Transformer as TimeTransformer } from './timeOfDay';
import { BusinessValidation } from './businessValidation';
// tslint:disable-next-line: no-circular-imports
import { Schedule } from './schedule';

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
			yield new BusinessValidation(`The interval between open and close times [${this.openTime} — ${this.closeTime}] must be greater than slot duration [${this.schedule.slotsDurationInMin} minutes]`);
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
