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
		const endsNextDay = this.lastSlotEndTime < this.firstSlotStartTime;
		const newDate = DateHelper.getDateOnly(endDate);
		newDate.setHours(this.lastSlotEndTime.getHours(), this.lastSlotEndTime.getMinutes());

		return endsNextDay ? DateHelper.addDays(newDate, 1) : newDate;
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

		const fistBlockStartTime = this.GetFirstBlockStartTime(range.startDatetime);
		const maxLastBlockEndTime = this.GetMaxLastBlockEndTime(range.endDatetime);

		let startTime = fistBlockStartTime;
		let currentTime = DateHelper.addMinutes(startTime, this.slotsDuration);

		while (currentTime <= maxLastBlockEndTime) {
			yield {
				startTime,
				endTime: currentTime
			} as Timeslot;

			startTime = currentTime;
			currentTime = DateHelper.addMinutes(currentTime, this.slotsDuration);
		}
	}
}

/* This class is *not* a database entity for now */
export class Timeslot {
	public startTime: Date;
	public endTime: Date;
}
