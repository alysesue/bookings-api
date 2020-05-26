import { Weekday, WeekdayList } from "../enums/weekday";
import { Schedule, TimeOfDay, WeekDaySchedule } from "../models";
import { ScheduleRequest, ScheduleResponse, WeekDayScheduleContract } from './schedules.apicontract';
import { groupByKeyLastValue } from '../tools/collections';

export const mapToEntity = (contract: ScheduleRequest, entity: Schedule): Schedule => {
	entity.name = contract.name;
	entity.slotsDurationInMin = contract.slotsDurationInMin;

	const weekDaysContract = groupByKeyLastValue(contract.weekdaySchedules || [], w => w.weekday);

	if (!entity.weekdaySchedules || entity.weekdaySchedules.length === 0) {
		entity.weekdaySchedules = WeekdayList.map(day => new WeekDaySchedule(day));
	}

	for (const daySchedule of entity.weekdaySchedules) {
		if (weekDaysContract.has(daySchedule.weekDay)) {
			const dayContract = weekDaysContract.get(daySchedule.weekDay);
			setDayContractEntity(dayContract, daySchedule);
		}
	}

	return entity;
};

const setDayContractEntity = (contract: WeekDayScheduleContract, entity: WeekDaySchedule): void => {
	entity.hasSchedule = contract.hasSchedule;
	entity.openTime = TimeOfDay.parse(contract.openTime);
	entity.closeTime = TimeOfDay.parse(contract.closeTime);
};

export const mapToResponse = (template: Schedule): ScheduleResponse => {
	const response = new ScheduleResponse();
	response.id = template.id;
	response.name = template.name;
	response.slotsDurationInMin = template.slotsDurationInMin;
	response.weekdaySchedules = template.weekdaySchedules?.map(w => mapDayScheduleToResponse(w)) || [];

	return response;
};

export const mapDayScheduleToResponse = (daySchedule: WeekDaySchedule): WeekDayScheduleContract => {
	const dayContract = new WeekDayScheduleContract();
	dayContract.weekday = daySchedule.weekDay;
	dayContract.hasSchedule = daySchedule.hasSchedule;
	dayContract.openTime = daySchedule.openTime?.toJSON();
	dayContract.closeTime = daySchedule.closeTime?.toJSON();

	return dayContract;
};
