import { ScheduleForm, TimeOfDay, WeekDayBreak, WeekDaySchedule } from '../../models';
import {
	ScheduleFormRequest,
	ScheduleFormResponse,
	WeekDayBreakContract,
	WeekDayScheduleContract,
} from './schedulesForm.apicontract';
import { groupByKeyLastValue } from '../../tools/collections';
import { getErrorResult, getOkResult, isErrorResult, OptionalResult } from '../../errors';

export const mapToEntity = (
	contract: ScheduleFormRequest,
	entity: ScheduleForm,
): OptionalResult<ScheduleForm, string[]> => {
	entity.name = contract.name;
	entity.slotsDurationInMin = contract.slotsDurationInMin;
	const errors: string[] = [];

	const weekDaysContract = groupByKeyLastValue(contract.weekdaySchedules || [], (w) => w.weekday);

	entity.initWeekdaySchedules();

	for (const daySchedule of entity.weekdaySchedules) {
		if (weekDaysContract.has(daySchedule.weekDay)) {
			const dayContract = weekDaysContract.get(daySchedule.weekDay);

			const dayResult = setDayContractEntity(dayContract, daySchedule);
			if (isErrorResult(dayResult)) {
				errors.push(...getErrorResult(dayResult));
			}
		}
	}

	return errors.length > 0 ? { errorResult: errors } : { result: entity };
};

const setDayContractEntity = (
	contract: WeekDayScheduleContract,
	entity: WeekDaySchedule,
): OptionalResult<WeekDaySchedule, string[]> => {
	entity.hasScheduleForm = contract.hasScheduleForm;
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

	const mappedBreaks = mapBreaks(contract, entity);
	if (isErrorResult(mappedBreaks)) {
		errors.push(...getErrorResult(mappedBreaks));
	} else {
		entity.breaks = getOkResult(mappedBreaks);
	}

	return errors.length > 0 ? { errorResult: errors } : { result: entity };
};

const mapBreaks = (
	daySchedule: WeekDayScheduleContract,
	entity: WeekDaySchedule,
): OptionalResult<WeekDayBreak[], string[]> => {
	const errors: string[] = [];
	const result: WeekDayBreak[] = [];

	for (const entry of daySchedule.breaks || []) {
		let startTime: TimeOfDay = null;
		let endTime: TimeOfDay = null;

		try {
			startTime = TimeOfDay.parse(entry.startTime);
		} catch (e) {
			errors.push(e.message);
		}

		try {
			endTime = TimeOfDay.parse(entry.endTime);
		} catch (e) {
			errors.push(e.message);
		}

		if (startTime && endTime) {
			const mapped = WeekDayBreak.create(daySchedule.weekday, startTime, endTime, entity.scheduleForm);
			result.push(mapped);
		}
	}

	return errors.length > 0 ? { errorResult: errors } : { result };
};

export const mapToResponse = (template: ScheduleForm): ScheduleFormResponse => {
	if (!template) {
		return null;
	}

	const response = new ScheduleFormResponse();
	response.id = template.id;
	response.name = template.name;
	response.slotsDurationInMin = template.slotsDurationInMin;
	response.weekdaySchedules = template.weekdaySchedules?.map((w) => mapDayScheduleToResponse(w)) || [];

	return response;
};

export const mapDayScheduleToResponse = (daySchedule: WeekDaySchedule): WeekDayScheduleContract => {
	const dayContract = new WeekDayScheduleContract();
	dayContract.weekday = daySchedule.weekDay;
	dayContract.hasScheduleForm = daySchedule.hasScheduleForm;
	dayContract.openTime = daySchedule.openTime?.toJSON();
	dayContract.closeTime = daySchedule.closeTime?.toJSON();
	dayContract.breaks = daySchedule.breaks?.map((e) => mapBreaksToResponse(e));

	return dayContract;
};

export const mapBreaksToResponse = (dayBreak: WeekDayBreak): WeekDayBreakContract => {
	const breakContract = new WeekDayBreakContract();
	breakContract.startTime = dayBreak.startTime.toJSON();
	breakContract.endTime = dayBreak.endTime.toJSON();

	return breakContract;
};
