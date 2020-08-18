import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";
import { Inject, InRequestScope } from 'typescript-ioc';
import { DeleteResult } from "typeorm";
import { SchedulesRepository } from "./schedules.repository";
import { Schedule } from '../../models';
import { ScheduleRequest, ScheduleResponse } from "./schedules.apicontract";
import { mapToEntity, mapToResponse } from './schedules.mapper';
import { getErrorResult, isErrorResult } from '../../errors';

@InRequestScope
export class SchedulesService {
	@Inject
	private schedulesRepository: SchedulesRepository;

	public async createSchedule(template: ScheduleRequest): Promise<ScheduleResponse> {
		const newSchedule = this.mapToEntityAndValidate(template, new Schedule());
		const templateSet = (await this.schedulesRepository.saveSchedule(newSchedule));
		return mapToResponse(templateSet);
	}

	public async updateSchedule(id: number, template: ScheduleRequest): Promise<ScheduleResponse> {
		const existingSchedule = await this.schedulesRepository.getScheduleById(id);
		if (!existingSchedule) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Schedule not found.');
		}
		let schedule = this.mapToEntityAndValidate(template, existingSchedule);

		schedule = (await this.schedulesRepository.saveSchedule(schedule));
		return mapToResponse(schedule);
	}

	public async getSchedules(): Promise<ScheduleResponse[]> {
		const schedules = await this.schedulesRepository.getSchedules();
		return schedules.map(s => mapToResponse(s));
	}

	public async getSchedule(id: number): Promise<Schedule> {
		return await this.schedulesRepository.getScheduleById(id);
	}

	public async deleteSchedule(id: number): Promise<DeleteResult> {
		return await this.schedulesRepository.deleteSchedule(id);
	}

	private mapToEntityAndValidate(template: ScheduleRequest, schedule: Schedule) {
		const mapped = mapToEntity(template, schedule);
		if (isErrorResult(mapped)) {
			const errorResult = getErrorResult(mapped);
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setResponseData(errorResult);
		}

		const validations = Array.from(schedule.validateSchedule());
		if (validations.length > 0) {
			const response = validations.map(val => val.message);
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setResponseData(response);
		}

		return schedule;
	}
}