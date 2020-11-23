import { Timeslot } from './timeslot';

/* this class is not a DB entity for now */
export class TimeslotWithCapacity extends Timeslot {
	private _capacity: number;
	public getCapacity = () => this._capacity;

	constructor(startTime: Date, endTime: Date, capacity?: number) {
		super(startTime, endTime);
		if (capacity === null || capacity === undefined) {
			this._capacity = 1;
		} else {
			this._capacity = capacity;
		}
	}
}
