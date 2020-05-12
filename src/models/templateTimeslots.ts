import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Weekday } from "../enums/weekday";
import { Calendar } from "./index";
import { ITemplateTimeslots } from "./templateTimeslots.interface";
import { ICalendar } from "./calendar.interface";
import { DateHelper } from '../infrastructure/dateHelper';
import { Timeslot } from './templateTimeslots.interface';

@Entity()
export class TemplateTimeslots implements ITemplateTimeslots {

	@PrimaryGeneratedColumn()
	public id: number;

	@Column({ type: "text" })
	public name: string;

	@Column({ type: "timestamp" })
	public firstSlotStartTime: Date;

	@Column({ type: "timestamp" })
	public lastSlotEndTime: Date;

	@Column({ type: "int" })
	public slotsDuration: number;

	@Column("int", { array: true })
	public weekdays: Weekday[];

	@ManyToMany("Calendar", "templateTimeslots")
	@JoinTable()
	public calendars: ICalendar[];

	constructor(name: string, firstSlotStartTime: Date, lastSlotEndTime: Date, slotsDuration: number, weekdays: Weekday[], calendars: Calendar[]) {
		this.name = name;
		this.firstSlotStartTime = DateHelper.keepHoursAndMinutes(firstSlotStartTime);
		this.lastSlotEndTime = DateHelper.keepHoursAndMinutes(lastSlotEndTime);
		this.slotsDuration = slotsDuration;
		this.weekdays = weekdays;
		this.calendars = calendars;
	}

	private getRelativeStartTime(startDate: Date) {
		const newDate = DateHelper.getDateOnly(startDate);
		newDate.setHours(this.firstSlotStartTime.getHours(), this.firstSlotStartTime.getMinutes());
		return newDate;
	}

	private getRelativeEndTime(endDate: Date) {
		const newDate = DateHelper.getDateOnly(endDate);
		newDate.setHours(this.lastSlotEndTime.getHours(), this.lastSlotEndTime.getMinutes());
		return newDate;
	}

	private getFirstBlockStartTime(startDatetime: Date): Date {
		let relativeStartDatetime = this.getRelativeStartTime(startDatetime);

		if (relativeStartDatetime < startDatetime) {
			const minutes = DateHelper.DiffInMinutes(startDatetime, relativeStartDatetime);
			const blocksInDiff = Math.floor(minutes / this.slotsDuration);

			// finds the first block's start time that is after startDatetime, also respecting slot duration
			relativeStartDatetime = DateHelper.addMinutes(relativeStartDatetime, (1 + blocksInDiff) * this.slotsDuration);
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

	public * generateValidTimeslots(range: { startDatetime: Date, endDatetime: Date }): Iterable<Timeslot> {
		if (range.endDatetime < range.startDatetime) {
			return;
		}

		const initialDate = DateHelper.getDateOnly(range.startDatetime);
		const daysCount = 1 + Math.floor(DateHelper.DiffInDays(DateHelper.getDateOnly(range.endDatetime), initialDate));

		for (let day = 0; day < daysCount; day++) {
			const date = DateHelper.addDays(initialDate, day);

			let startTime = (day === 0) ? this.getFirstBlockStartTime(range.startDatetime) : this.getRelativeStartTime(date);
			let currentEndTime = DateHelper.addMinutes(startTime, this.slotsDuration);

			const maxLastBlockEndTime = (day === daysCount - 1) ? this.getMaxLastBlockEndTime(range.endDatetime) : this.getRelativeEndTime(date);

			while (currentEndTime <= maxLastBlockEndTime) {
				yield new Timeslot(startTime, currentEndTime);

				startTime = currentEndTime;
				currentEndTime = DateHelper.addMinutes(currentEndTime, this.slotsDuration);
			}
		}
	}
}
