import { TimeOfDay } from './timeOfDay';
import { Service } from 'mol-lib-api-contract';

export interface ISchedule {
	slotsDurationInMin: number;
}

export interface IEntityWithSchedule {
	scheduleId: number;
	schedule: ISchedule;
}

export interface ITimeslotsSchedule { }

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
	organisationId: number;
}

export interface IServiceProvider {
	id: number;
	serviceId: number;
	service: IService;
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
