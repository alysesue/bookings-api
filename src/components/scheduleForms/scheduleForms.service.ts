import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { Inject, InRequestScope } from 'typescript-ioc';
import { DeleteResult } from 'typeorm';
import { ScheduleFormsRepository } from './scheduleForms.repository';
import { ScheduleForm, ServiceProvider, TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../../models';
import { ScheduleFormRequest, ScheduleFormResponse } from './scheduleForms.apicontract';
import { mapToEntity, mapToResponse } from './scheduleForms.mapper';
import { getErrorResult, isErrorResult } from '../../errors';
import { ServiceProvidersRepository } from '../serviceProviders/serviceProviders.repository';
import { intersects } from '../../tools/timeSpan';

@InRequestScope
export class ScheduleFormsService {
	@Inject
	private scheduleFormsRepository: ScheduleFormsRepository;

	@Inject
	private serviceProvidersRepository: ServiceProvidersRepository;

	public async createScheduleForm(template: ScheduleFormRequest): Promise<ScheduleFormResponse> {
		const newSchedule = this.mapToEntityAndValidate(template, new ScheduleForm());
		await this.generateTimeslots(template.serviceProviderId, newSchedule);
		const templateSet = await this.scheduleFormsRepository.saveScheduleForm(newSchedule);
		return mapToResponse(templateSet);
	}

	private async generateTimeslots(serviceProviderId: number, scheduleForm: ScheduleForm) {
		const serviceProvider = await this.serviceProvidersRepository.getServiceProvider({ id: serviceProviderId });
		serviceProvider.timeslotsSchedule = TimeslotsSchedule.create(undefined, serviceProvider);
		serviceProvider.timeslotsSchedule.timeslotItems = this.generateTimeslotsItems(serviceProvider, scheduleForm);
		await this.serviceProvidersRepository.save(serviceProvider);
	}

	private generateTimeslotsItems(serviceProvider: ServiceProvider, scheduleForm: ScheduleForm): TimeslotItem[] {
		const timeslotItems = [];
		const activeWeekdaySchedules = scheduleForm.weekdaySchedules.filter((weekday) => weekday.hasScheduleForm);
		activeWeekdaySchedules.forEach((weekDay) => {
			let startTimeslotItem = weekDay.openTime;
			let endTimeslotItem = TimeOfDay.addMinuntes(startTimeslotItem, scheduleForm.slotsDurationInMin);
			while (TimeOfDay.compare(weekDay.closeTime, endTimeslotItem) >= 0) {
				const findOverlapsBreak = weekDay.breaks.find((breakRange) =>
					intersects(
						{
							startTime: startTimeslotItem,
							endTime: endTimeslotItem,
						},
						breakRange.startTime,
						breakRange.endTime,
					),
				);
				if (findOverlapsBreak) {
					startTimeslotItem = findOverlapsBreak.endTime;
				} else {
					const timeslotItem = TimeslotItem.create(
						serviceProvider.timeslotsScheduleId,
						weekDay.weekDay,
						startTimeslotItem,
						endTimeslotItem,
					);
					timeslotItems.push(timeslotItem);
					startTimeslotItem = endTimeslotItem;
				}
				endTimeslotItem = TimeOfDay.addMinuntes(startTimeslotItem, scheduleForm.slotsDurationInMin);
			}
		});
		return timeslotItems;
	}

	public async updateScheduleForm(id: number, template: ScheduleFormRequest): Promise<ScheduleFormResponse> {
		const existingSchedule = await this.scheduleFormsRepository.getScheduleFormById(id);
		if (!existingSchedule) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('ScheduleFormsRepository form not found.');
		}
		let schedule = this.mapToEntityAndValidate(template, existingSchedule);

		schedule = await this.scheduleFormsRepository.saveScheduleForm(schedule);
		return mapToResponse(schedule);
	}

	public async getScheduleForms(): Promise<ScheduleFormResponse[]> {
		const schedules = await this.scheduleFormsRepository.getScheduleForms();
		return schedules.map((s) => mapToResponse(s));
	}

	public async getScheduleForm(id: number): Promise<ScheduleForm> {
		return await this.scheduleFormsRepository.getScheduleFormById(id);
	}

	public async deleteScheduleForm(id: number): Promise<DeleteResult> {
		return await this.scheduleFormsRepository.deleteScheduleForm(id);
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
