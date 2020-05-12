import { Weekday } from "../enums/weekday";

export interface ITemplateTimeslots {
	id: number;
	name: string;
	firstSlotStartTime: Date;
	lastSlotEndTime: Date;
	slotsDuration: number;
	weekdays: Weekday[];

	generateValidTimeslots(range: { startDatetime: Date, endDatetime: Date }): Iterable<Timeslot>;
}

export class Timeslot {
	private _startTime: Date;
	private _endTime: Date;

	public getStartTime = () => this._startTime;
	public getEndTime = () => this._endTime;

	constructor(startTime: Date, endTime: Date) {
		this._startTime = startTime;
		this._endTime = endTime;
	}
}
