export interface ISchedule {
	slotsDurationInMin: number;
}

export interface IEntityWithSchedule {
	scheduleId: number;
	schedule: ISchedule;
}

export interface ITimeslotsSchedule {
}
