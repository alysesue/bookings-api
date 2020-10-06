import { TimeOfDay } from './timeOfDay';

export interface IScheduleForm {
	slotsDurationInMin: number;
}

export interface IEntityWithScheduleForm {
	scheduleFormId: number;
	scheduleForm: IScheduleForm;
}

export interface ITimeslotsSchedule {}

export interface IEntityWithTimeslotsSchedule {
	timeslotsScheduleId: number;
	timeslotsSchedule: ITimeslotsSchedule;
}

export interface IUser {
	id: number;
}

export interface IOrganisation {
	id: number;
}

export interface IService {
	id: number;
}

export interface IServiceProvider {
	id: number;
}

export interface ITimeSpan {
	startTime: TimeOfDay;
	endTime: TimeOfDay;
}

export interface IDateSpan {
	start: Date;
	end: Date;
}

export interface IUnavailability {
	serviceId: number;
	start: Date;
	end: Date;
}
