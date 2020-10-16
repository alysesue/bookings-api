import { Timeslot } from './timeslot';

/* this class is not a DB entity for now */
export class TimeslotWithCapacity extends Timeslot {
	private _capacity: number;
	public getCapacity = () => this._capacity;

	constructor(startTime: Date, endTime: Date) {
		super(startTime, endTime);
	}
}
