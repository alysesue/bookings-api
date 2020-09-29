import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { Inject, InRequestScope } from 'typescript-ioc';
import { DeleteResult } from 'typeorm';
import { SchedulesFormRepository } from './schedulesForm.repository';
import { ScheduleForm } from '../../models';
import { ScheduleFormRequest, ScheduleFormResponse } from './schedulesForm.apicontract';
import { mapToEntity, mapToResponse } from './schedulesForm.mapper';
import { getErrorResult, isErrorResult } from '../../errors';

@InRequestScope
export class SchedulesFormService {
	@Inject
	private schedulesFormRepository: SchedulesFormRepository;

	public async createScheduleForm(template: ScheduleFormRequest): Promise<ScheduleFormResponse> {
		const newSchedule = this.mapToEntityAndValidate(template, new ScheduleForm());
		const templateSet = await this.schedulesFormRepository.saveScheduleForm(newSchedule);
		return mapToResponse(templateSet);
	}

	public async updateScheduleForm(id: number, template: ScheduleFormRequest): Promise<ScheduleFormResponse> {
		const existingSchedule = await this.schedulesFormRepository.getScheduleFormById(id);
		if (!existingSchedule) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('SchedulesFormRepository form not found.');
		}
		let schedule = this.mapToEntityAndValidate(template, existingSchedule);

		schedule = await this.schedulesFormRepository.saveScheduleForm(schedule);
		return mapToResponse(schedule);
	}

	public async getSchedulesForm(): Promise<ScheduleFormResponse[]> {
		const schedules = await this.schedulesFormRepository.getSchedulesForm();
		return schedules.map((s) => mapToResponse(s));
	}

	public async getScheduleForm(id: number): Promise<ScheduleForm> {
		return await this.schedulesFormRepository.getScheduleFormById(id);
	}

	public async deleteScheduleForm(id: number): Promise<DeleteResult> {
		return await this.schedulesFormRepository.deleteScheduleForm(id);
	}

	private mapToEntityAndValidate(template: ScheduleFormRequest, schedule: ScheduleForm) {
		const mapped = mapToEntity(template, schedule);
		if (isErrorResult(mapped)) {
			const errorResult = getErrorResult(mapped);
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setResponseData(errorResult);
		}

		const validations = Array.from(schedule.validateSchedule());
		if (validations.length > 0) {
			const response = validations.map((val) => val.message);
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setResponseData(response);
		}

		return schedule;
	}
}
