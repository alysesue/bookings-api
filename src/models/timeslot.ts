import { Label } from './entities/label';

/* this interface is not a DB entity for now */
export interface Timeslot {
	readonly startTimeNative: number;
	readonly endTimeNative: number;
	readonly labels: Label[];
}
