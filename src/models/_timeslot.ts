/* this class is not a DB entity for now */
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
