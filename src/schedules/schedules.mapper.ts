import { WeekdayList } from "../enums/weekday";
import { Schedule, TimeOfDay, WeekDaySchedule } from "../models";
import { ScheduleRequest, ScheduleResponse, WeekDayScheduleContract } from './schedules.apicontract';
import { groupByKeyLastValue } from '../tools/collections';
import { getErrorResult, isErrorResult, OptionalResult } from '../errors';

export const mapToEntity = (contract: ScheduleRequest, entity: Schedule): OptionalResult<Schedule, string[]> => {
	entity.name = contract.name;
	entity.slotsDurationInMin = contract.slotsDurationInMin;
	const errors: string[] = [];

	const weekDaysContract = groupByKeyLastValue(contract.weekdaySchedules || [], w => w.weekday);

	if (!entity.weekdaySchedules || entity.weekdaySchedules.length === 0) {
		entity.weekdaySchedules = WeekdayList.map(day => new WeekDaySchedule(day));
	}

	for (const daySchedule of entity.weekdaySchedules) {
		if (weekDaysContract.has(daySchedule.weekDay)) {
			const dayContract = weekDaysContract.get(daySchedule.weekDay);

			const dayResult = setDayContractEntity(dayContract, daySchedule);
			if (isErrorResult(dayResult)) {
				errors.push(...getErrorResult(dayResult));
			}
		}
	}

	if (errors.length > 0) {
		return {
			errorResult: errors
		};
	}
	return {
		result: entity
	};
};

const setDayContractEntity = (contract: WeekDayScheduleContract, entity: WeekDaySchedule): OptionalResult<WeekDaySchedule, string[]> => {
	entity.hasSchedule = contract.hasSchedule;
	const errors: string[] = [];

	try {
		entity.openTime = TimeOfDay.parse(contract.openTime);
	} catch (e) {
		errors.push(e.message);
	}

	try {
		entity.closeTime = TimeOfDay.parse(contract.closeTime);
	} catch (e) {
		errors.push(e.message);
	}

	if (errors.length > 0) {
		return {
			errorResult: errors
		};
	}

	return {
		result: entity
	};
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
