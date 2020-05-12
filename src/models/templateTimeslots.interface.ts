import { Weekday } from "../enums/weekday";

export interface ITemplateTimeslots {
	id: number;
	name: string;
	firstSlotStartTime: Date;
	lastSlotEndTime: Date;
	slotsDuration: number;
	weekdays: Weekday[];
}
