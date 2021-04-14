import { Label } from './entities/label';
import { Timeslot } from './timeslot';

/* this interface is not a DB entity for now */
export interface TimeslotWithCapacity extends Timeslot {
	readonly capacity: number;
	readonly labels: Label[];
}
