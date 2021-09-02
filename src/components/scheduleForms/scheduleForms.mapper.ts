import { ScheduleForm, TimeOfDay, WeekDayBreak, WeekDaySchedule } from '../../models';
import { groupByKeyLastValue } from '../../tools/collections';
import { getErrorResult, getOkResult, isErrorResult, OptionalResult } from '../../errors';
import {
	ScheduleFormRequest,
	ScheduleFormResponseV1,
	ScheduleFormResponseV2,
	WeekDayBreakContract,
	WeekDayScheduleContract,
} from './scheduleForms.apicontract';
import { Inject } from 'typescript-ioc';
import { IdHasher } from '../../infrastructure/idHasher';

export class ScheduleFormsMapper {
	@Inject
	private idHasher: IdHasher;

	public mapToEntity(contract: ScheduleFormRequest, entity: ScheduleForm): OptionalResult<ScheduleForm, string[]> {
		entity.slotsDurationInMin = contract.slotsDurationInMin;
		entity.startDate = contract.startDate;
		entity.endDate = contract.endDate;
		const errors: string[] = [];
		const weekDaysContract = groupByKeyLastValue(contract.weekdaySchedules || [], (w) => w.weekday);
		entity.initWeekdaySchedules();

		for (const daySchedule of entity.weekdaySchedules) {
			if (weekDaysContract.has(daySchedule.weekDay)) {
				const dayContract = weekDaysContract.get(daySchedule.weekDay);
				dayContract.startDate = contract.startDate;
				dayContract.endDate = contract.endDate;
				const dayResult = this.setDayContractEntity(dayContract, daySchedule);
				if (isErrorResult(dayResult)) {
					errors.push(...getErrorResult(dayResult));
				}
			}
		}

		return errors.length > 0 ? { errorResult: errors } : { result: entity };
	}

	private setDayContractEntity(
		contract: WeekDayScheduleContract,
		entity: WeekDaySchedule,
	): OptionalResult<WeekDaySchedule, string[]> {
		entity.hasScheduleForm = contract.hasScheduleForm;
		entity.capacity = contract.capacity;
		entity.startDate = contract.startDate;
		entity.endDate = contract.endDate;
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

		const mappedBreaks = this.mapBreaks(contract, entity);
		if (isErrorResult(mappedBreaks)) {
			errors.push(...getErrorResult(mappedBreaks));
		} else {
			entity.breaks = getOkResult(mappedBreaks);
		}

		return errors.length > 0 ? { errorResult: errors } : { result: entity };
	}

	private mapBreaks(
		daySchedule: WeekDayScheduleContract,
		entity: WeekDaySchedule,
	): OptionalResult<WeekDayBreak[], string[]> {
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
	}

	public mapToResponseV1(template: ScheduleForm): ScheduleFormResponseV1 {
		if (!template) {
			return undefined;
		}

		const response = new ScheduleFormResponseV1();
		response.id = template.id;
		response.slotsDurationInMin = template.slotsDurationInMin;
		response.weekdaySchedules = template.weekdaySchedules?.map((w) => this.mapDayScheduleToResponse(w)) || [];
		response.startDate = template.startDate;
		response.endDate = template.endDate;

		return response;
	}

	public mapToResponseV2(template: ScheduleForm): ScheduleFormResponseV2 {
		if (!template) {
			return undefined;
		}

		const response = new ScheduleFormResponseV2();

		response.id = this.idHasher.encode(template.id);
		response.slotsDurationInMin = template.slotsDurationInMin;
		response.weekdaySchedules = template.weekdaySchedules?.map((w) => this.mapDayScheduleToResponse(w)) || [];
		response.startDate = template.startDate;
		response.endDate = template.endDate;

		return response;
	}

	private mapDayScheduleToResponse(daySchedule: WeekDaySchedule): WeekDayScheduleContract {
		const dayContract = new WeekDayScheduleContract();
		dayContract.weekday = daySchedule.weekDay;
		dayContract.hasScheduleForm = daySchedule.hasScheduleForm;
		dayContract.openTime = daySchedule.openTime?.toJSON();
		dayContract.closeTime = daySchedule.closeTime?.toJSON();
		dayContract.breaks = daySchedule.breaks?.map((e) => this.mapBreaksToResponse(e));
		dayContract.capacity = daySchedule.capacity;
		dayContract.startDate = daySchedule.startDate;
		dayContract.endDate = daySchedule.endDate;

		return dayContract;
	}

	private mapBreaksToResponse = (dayBreak: WeekDayBreak): WeekDayBreakContract => {
		const breakContract = new WeekDayBreakContract();
		breakContract.startTime = dayBreak.startTime.toJSON();
		breakContract.endTime = dayBreak.endTime.toJSON();

		return breakContract;
	};
}
