import { Inject, Singleton } from 'typescript-ioc';
import { DeleteResult } from "typeorm";
import { SchedulesRepository } from "./schedules.repository";
import { Schedule } from '../models/Schedule';
import { ScheduleRequest, ScheduleResponse } from "./schedules.apicontract";
import { mapToEntity, mapToResponse } from './schedules.mapper';

@Singleton
export default class SchedulesService {
	@Inject
	private timeslotsRepository: SchedulesRepository;

	public async createSchedule(template: ScheduleRequest): Promise<ScheduleResponse> {
		const newTemplateModel: Schedule = mapToEntity(template, new Schedule());
		newTemplateModel.validateSchedule();

		const templateSet: Schedule = (await this.timeslotsRepository.setSchedule(newTemplateModel));
		return mapToResponse(templateSet);
	}

	public async updateSchedule(template: ScheduleRequest): Promise<ScheduleResponse> {
		const templateGet: Schedule = await this.timeslotsRepository.getScheduleByName(template.name);
		const schedule = mapToEntity(template, templateGet || new Schedule());
		schedule.validateSchedule();

		const templateSet: Schedule = (await this.timeslotsRepository.setSchedule(schedule));
		return mapToResponse(templateSet);
	}

	public async deleteSchedule(id: number): Promise<DeleteResult> {
		return await this.timeslotsRepository.deleteSchedule(id);
	}
}
