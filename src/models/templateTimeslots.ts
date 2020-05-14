import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Weekday } from "../enums/weekday";
import { TemplateTimeslotRequest } from "../components/templatesTimeslots/templatesTimeslots.apicontract";
import { DateHelper } from '../infrastructure/dateHelper';
import { parseHHmm } from '../tools/date';
import { Timeslot } from './Timeslot';

@Entity()
export class TemplateTimeslots extends BaseEntity {

	@PrimaryGeneratedColumn()
	public id: number;

	@Column({ type: "text" })
	public name: string;

	@Column({ type: "time" })
	public firstSlotStartTimeInHHmm: string;

	@Column({ type: "time" })
	public lastSlotEndTimeInHHmm: string;

	@Column({ type: "int" })
	public slotsDurationInMin: number;

	@Column("int", { array: true })
	public weekdays: Weekday[];

	constructor() {
		super();
	}

	public mapTemplateTimeslotRequest(template: TemplateTimeslotRequest) {
		this.name = template.name;
		this.firstSlotStartTimeInHHmm = template.firstSlotStartTimeInHHmm;
		this.lastSlotEndTimeInHHmm = template.lastSlotEndTimeInHHmm;
		this.slotsDurationInMin = template.slotsDurationInMin;
		this.weekdays = template.weekdays;
	}

	private getRelativeStartTime(startDate: Date) {
		const newDate = DateHelper.getDateOnly(startDate);
		const { hours, minutes } = parseHHmm(this.firstSlotStartTimeInHHmm);
		newDate.setHours(hours, minutes);
		return newDate;
	}

	private getRelativeEndTime(endDate: Date) {
		const newDate = DateHelper.getDateOnly(endDate);
		const { hours, minutes } = parseHHmm(this.lastSlotEndTimeInHHmm);
		newDate.setHours(hours, minutes);
		return newDate;
	}

	private getFirstBlockStartTime(startDatetime: Date): Date {
		let relativeStartDatetime = this.getRelativeStartTime(startDatetime);

		if (relativeStartDatetime < startDatetime) {
			const minutes = DateHelper.DiffInMinutes(startDatetime, relativeStartDatetime);
			const blocksInDiff = Math.floor(minutes / this.slotsDurationInMin);

			// finds the first block's start time that is after startDatetime, also respecting slot duration
			relativeStartDatetime = DateHelper.addMinutes(relativeStartDatetime, (1 + blocksInDiff) * this.slotsDurationInMin);
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

	public isValidWeekday(date: Date) {
		const dayOfWeek: number = date.getDay();
		return this.weekdays.indexOf(dayOfWeek) >= 0;
	}

	public * generateValidTimeslots(range: { startDatetime: Date, endDatetime: Date }): Iterable<Timeslot> {
		if (range.endDatetime < range.startDatetime) {
			return;
		}

		const initialDate = DateHelper.getDateOnly(range.startDatetime);
		const daysCount = 1 + Math.floor(DateHelper.DiffInDays(DateHelper.getDateOnly(range.endDatetime), initialDate));

		for (let day = 0; day < daysCount; day++) {
			const date = DateHelper.addDays(initialDate, day);

			if (!this.isValidWeekday(date)) {
				continue;
			}

			let startTime = (day === 0) ? this.getFirstBlockStartTime(range.startDatetime) : this.getRelativeStartTime(date);
			let currentEndTime = DateHelper.addMinutes(startTime, this.slotsDurationInMin);

			const maxLastBlockEndTime = (day === daysCount - 1) ? this.getMaxLastBlockEndTime(range.endDatetime) : this.getRelativeEndTime(date);

			while (currentEndTime <= maxLastBlockEndTime) {
				yield new Timeslot(startTime, currentEndTime);

				startTime = currentEndTime;
				currentEndTime = DateHelper.addMinutes(currentEndTime, this.slotsDurationInMin);
			}
		}
	}
}
