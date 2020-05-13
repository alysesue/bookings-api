import { Weekday } from "../../enums/weekday";
import { TemplateTimeslots } from "../../models";
import { ICalendar } from "../../models/calendar.interface";

export class TemplateTimeslotRequest {
	public name: string;
	public firstSlotStartTimeInHHmm: string;
	public firstSlotEndTimeInHHmm: string;
	public slotsDurationInMin: number;
	public weekdays: Weekday[];
	public calendar: ICalendar;

	constructor(name, firstSlotStartTimeInHHmm, firstSlotEndTimeInHHmm, slotsDurationInMin, weekdays, calendars) {
		this.name = name;
		this.firstSlotStartTimeInHHmm = firstSlotStartTimeInHHmm;
		this.firstSlotEndTimeInHHmm = firstSlotEndTimeInHHmm;
		this.slotsDurationInMin = slotsDurationInMin;
		this.weekdays = weekdays;
		this.calendar = calendars;
	}
}

export class TemplateTimeslotResponse {
	public id: number;
	public name: string;
	public firstSlotStartTimeInHHmm: string;
	public firstSlotEndTimeInHHmm: string;
	public slotsDurationInMin: number;
	public weekdays: Weekday[];
	public calendar: ICalendar;

	constructor(template: TemplateTimeslots) {
		this.id = template.id;
		this.name = template.name;
		this.firstSlotStartTimeInHHmm = template.firstSlotStartTimeInHHmm;
		this.firstSlotEndTimeInHHmm = template.firstSlotEndTimeInHHmm;
		this.slotsDurationInMin = template.slotsDurationInMin;
		this.weekdays = template.weekdays;
		this.calendar = template.calendar;
	}
}