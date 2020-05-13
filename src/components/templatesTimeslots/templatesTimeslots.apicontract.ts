import { Weekday } from "../../enums/weekday";
import { TemplateTimeslots } from "../../models";

export class TemplateTimeslotRequest {
	public name: string;
	public firstSlotStartTimeInHHmm: string;
	public firstSlotEndTimeInHHmm: string;
	public slotsDurationInMin: number;
	public weekdays: Weekday[];

	constructor(name, firstSlotStartTimeInHHmm, firstSlotEndTimeInHHmm, slotsDurationInMin, weekdays) {
		this.name = name;
		this.firstSlotStartTimeInHHmm = firstSlotStartTimeInHHmm;
		this.firstSlotEndTimeInHHmm = firstSlotEndTimeInHHmm;
		this.slotsDurationInMin = slotsDurationInMin;
		this.weekdays = weekdays;
	}
}

export class TemplateTimeslotResponse {
	public id: number;
	public name: string;
	public firstSlotStartTimeInHHmm: string;
	public firstSlotEndTimeInHHmm: string;
	public slotsDurationInMin: number;
	public weekdays: Weekday[];

	constructor(template: TemplateTimeslots) {
		this.id = template.id;
		this.name = template.name;
		this.firstSlotStartTimeInHHmm = template.firstSlotStartTimeInHHmm;
		this.firstSlotEndTimeInHHmm = template.firstSlotEndTimeInHHmm;
		this.slotsDurationInMin = template.slotsDurationInMin;
		this.weekdays = template.weekdays;
	}
}