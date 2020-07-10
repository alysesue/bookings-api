import { ITimeSpan } from "../models/interfaces";
import { TimeOfDay } from "../models";

export const intersectsSpan = (a: ITimeSpan, b: ITimeSpan) => {
	return intersects(a, b.startTime, b.endTime);
};

export const intersects = (timeSpan: ITimeSpan, startTime: TimeOfDay, endTime: TimeOfDay) => {
	const compareAEndBStart = TimeOfDay.compare(timeSpan.endTime, startTime);
	if (compareAEndBStart > 0) {
		const compareBEndAStart = TimeOfDay.compare(endTime, timeSpan.startTime);
		return compareBEndAStart > 0;
	}

	return false;
};

