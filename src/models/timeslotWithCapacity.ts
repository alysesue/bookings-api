import { Label } from './entities/label';
import { Timeslot } from './timeslot';

/* this interface is not a DB entity for now */
export interface TimeslotWithCapacity extends Timeslot {
	readonly capacity: number;
	readonly serviceProviderId?: number;
	readonly oneOffTimeslotId?: number;
	readonly labels?: Label[];
	readonly title?: string;
	readonly description?: string;
	readonly isRecurring?: boolean;
}
