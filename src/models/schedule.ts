import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DateHelper } from '../infrastructure/dateHelper';
import { Timeslot } from './timeslot';
import { TimeOfDay, Transformer as TimeTransformer } from './timeOfDay';
import { groupByKeyLastValue } from '../tools/collections';
import { BusinessValidation } from './businessValidation';
// tslint:disable-next-line: no-circular-imports
import { WeekDaySchedule } from './weekDaySchedule';

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

	private ensureWeekdayParentIsSet(): void {
		for (const weekdaySchedule of this.weekdaySchedules) {
			if (weekdaySchedule.schedule !== this) {
				weekdaySchedule.schedule = this;
			}
		}
	}

	public * validateSchedule(): Iterable<BusinessValidation> {
		this.ensureWeekdayParentIsSet();
		for (const weekdaySchedule of this.weekdaySchedules) {
			for (const validation of weekdaySchedule.validateWeekDaySchedule()) {
				yield validation;
			}
		}
	}

	public * generateValidTimeslots(range: { startDatetime: Date, endDatetime: Date }): Iterable<Timeslot> {
		this.ensureWeekdayParentIsSet();
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
