import { Column, Entity, PrimaryGeneratedColumn, Timestamp } from 'typeorm';
import { start } from 'repl';
import { DateHelper } from '../infrastructure/dateHelper';

@Entity()
export class TemplateTimeslots {

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

	constructor(name: string, firstSlotStartTime: Date, lastSlotEndTime: Date, slotsDuration: number) {
		this.name = name;
		this.firstSlotStartTime = DateHelper.keepHoursAndMinutes(firstSlotStartTime);
		this.lastSlotEndTime = DateHelper.keepHoursAndMinutes(lastSlotEndTime);
		this.slotsDuration = slotsDuration;
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

	private GetFirstBlockStartTime(startDatetime: Date): Date {
		let relativeStartDatetime = this.getRelativeStartTime(startDatetime);

		if (relativeStartDatetime < startDatetime) {
			const minutes = DateHelper.DiffInMinutes(startDatetime, relativeStartDatetime);
			const blocksInDiff = Math.floor(minutes / this.slotsDuration);

			// finds the first block's start time that is after startDatetime, also respecting slot duration
			relativeStartDatetime = DateHelper.addMinutes(relativeStartDatetime, (1 + blocksInDiff) * this.slotsDuration);
		}

		return relativeStartDatetime;
	}

	private GetMaxLastBlockEndTime(endDateTime: Date) {
		let relativeEndDatetime = this.getRelativeEndTime(endDateTime);

		if (relativeEndDatetime > endDateTime) {
			relativeEndDatetime = endDateTime;
		}

		return relativeEndDatetime;
	}

	public * GenerateValidTimeslots(range: { startDatetime: Date, endDatetime: Date }): Iterable<Timeslot> {
		if (range.endDatetime < range.startDatetime) {
			return;
		}

		const initialDate = DateHelper.getDateOnly(range.startDatetime);
		const daysCount = 1 + Math.floor(DateHelper.DiffInDays(DateHelper.getDateOnly(range.endDatetime), initialDate));

		for (let day = 0; day < daysCount; day++) {
			const date = DateHelper.addDays(initialDate, day);

			let startTime = (day === 0) ? this.GetFirstBlockStartTime(range.startDatetime) : this.getRelativeStartTime(date);
			let currentEndTime = DateHelper.addMinutes(startTime, this.slotsDuration);

			const maxLastBlockEndTime = (day === daysCount - 1) ? this.GetMaxLastBlockEndTime(range.endDatetime) : this.getRelativeEndTime(date);

			while (currentEndTime <= maxLastBlockEndTime) {
				yield {
					startTime,
					endTime: currentEndTime
				} as Timeslot;

				startTime = currentEndTime;
				currentEndTime = DateHelper.addMinutes(currentEndTime, this.slotsDuration);
			}
		}
	}
}

/* This class is *not* a database entity for now */
export class Timeslot {
	public startTime: Date;
	public endTime: Date;
}
