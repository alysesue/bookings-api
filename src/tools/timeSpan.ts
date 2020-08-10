import { IDateSpan, ITimeSpan } from "../models/interfaces";
import { TimeOfDay } from "../models/timeOfDay";

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

export const intersectsDateTimeSpan = (dateSpan: IDateSpan, startDate: Date, endDate: Date) => {
	return dateSpan.start <= endDate && startDate <= dateSpan.end;
};

export const intersectsDateTime = (startDateA: Date, endDateA: Date, startDateB: Date, endDateB: Date) => {
	return startDateA < endDateB && startDateB < endDateA;
};
