import { Weekday } from "../../enums/weekday";
import { Calendar } from "../../models/calendar";
import { TemplateTimeslots } from "../../models";

export class TemplateTimeslotRequest {
	public name: string;
	public firstSlotStartTimeInHHmm: string;
	public firstSlotEndTimeInHHmm: string;
	public slotsDurationInMin: number;
	public weekdays: Weekday[];
	public calendars: Calendar;

	constructor(name, firstSlotStartTimeInHHmm, firstSlotEndTimeInHHmm, slotsDurationInMin, weekdays, calendars) {
		this.name = name;
		this.firstSlotStartTimeInHHmm = firstSlotStartTimeInHHmm;
		this.firstSlotEndTimeInHHmm = firstSlotEndTimeInHHmm;
		this.slotsDurationInMin = slotsDurationInMin;
		this.weekdays = weekdays;
		this.calendars = calendars;
	}
}

export class TemplateTimeslotResponse {
	public id: number;
	public name: string;
	public firstSlotStartTimeInHHmm: string;
	public firstSlotEndTimeInHHmm: string;
	public slotsDurationInMin: number;
	public weekdays: Weekday[];
	public calendars: Calendar;

	constructor(template: TemplateTimeslots) {
		this.id = template.id;
		this.name = template.name;
		this.firstSlotStartTimeInHHmm = template.firstSlotStartTimeInHHmm;
		this.firstSlotEndTimeInHHmm = template.firstSlotEndTimeInHHmm;
		this.slotsDurationInMin = template.slotsDurationInMin;
		this.weekdays = template.weekdays;
		this.calendars = template.calendars;
	}
}