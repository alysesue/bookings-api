import { Weekday } from "../../enums/weekday";
import { Calendar } from "../../models/calendar";

export class TimeslotParams {
	public name: string;
	public firstSlotStartTime: Date;
	public lastSlotEndTime: Date;
	public slotsDuration: number;
	public weekdays: Weekday[];
	public calendars: Calendar[];
}

