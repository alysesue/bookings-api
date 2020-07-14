import { TimeOfDay } from "./timeOfDay";

export interface ISchedule {
	slotsDurationInMin: number;
}

export interface IEntityWithSchedule {
	scheduleId: number;
	schedule: ISchedule;
}

export interface ITimeslotsSchedule {
}

export interface IEntityWithTimeslotsSchedule {
	timeslotsScheduleId: number;
	timeslotsSchedule: ITimeslotsSchedule;
}

export interface IService {
}

export interface IServiceProvider {
}

export interface ITimeSpan {
	startTime: TimeOfDay;
	endTime: TimeOfDay;
}
