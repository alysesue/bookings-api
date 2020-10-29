import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { Inject, InRequestScope } from 'typescript-ioc';
import { DeleteResult } from 'typeorm';
import { ScheduleFormsRepository } from './scheduleForms.repository';
import { ScheduleForm, ServiceProvider, TimeslotItem, TimeslotsSchedule } from '../../models';
import { ScheduleFormRequest, ScheduleFormResponse } from './scheduleForms.apicontract';
import { mapToEntity, mapToResponse } from './scheduleForms.mapper';
import { getErrorResult, isErrorResult } from '../../errors';
import { ServiceProvidersRepository } from '../serviceProviders/serviceProviders.repository';
import { UserContext } from '../../infrastructure/auth/userContext';
import { ScheduleFormsActionAuthVisitor } from './scheduleForms.auth';
import { CrudAction } from '../../enums/crudAction';

@InRequestScope
export class ScheduleFormsService {
	@Inject
	private scheduleFormsRepository: ScheduleFormsRepository;

	@Inject
	private serviceProvidersRepository: ServiceProvidersRepository;

	@Inject
	private userContext: UserContext;

	private async verifyActionPermission(serviceProvider: ServiceProvider, action: CrudAction): Promise<void> {
		const authGroups = await this.userContext.getAuthGroups();
		if (!new ScheduleFormsActionAuthVisitor(serviceProvider, action).hasPermission(authGroups)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
				`User cannot perform this scheduleForm action for this service.`,
			);
		}
	}

	public async createScheduleForm(template: ScheduleFormRequest): Promise<ScheduleFormResponse> {
		const newSchedule = this.mapToEntityAndValidate(template, new ScheduleForm());
		const serviceProvider = await this.serviceProvidersRepository.getServiceProvider({
			id: template.serviceProviderId,
		});
		await this.verifyActionPermission(serviceProvider, CrudAction.Create);
		await this.generateTimeslots(serviceProvider, newSchedule);
		const scheduleForm = await this.scheduleFormsRepository.saveScheduleForm(newSchedule);
		serviceProvider.scheduleForm = scheduleForm;
		await this.serviceProvidersRepository.save(serviceProvider);
		return mapToResponse(scheduleForm);
	}

	private async generateTimeslots(serviceProvider: ServiceProvider, scheduleForm: ScheduleForm) {
		serviceProvider.timeslotsSchedule = TimeslotsSchedule.create(undefined, serviceProvider);
		serviceProvider.timeslotsSchedule.timeslotItems = TimeslotItem.generateTimeslotsItems(
			scheduleForm,
			serviceProvider.timeslotsScheduleId,
		);
	}

	public async updateScheduleForm(id: number, template: ScheduleFormRequest): Promise<ScheduleFormResponse> {
		const existingSchedule = await this.scheduleFormsRepository.getScheduleFormById(id);
		if (!existingSchedule) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('ScheduleFormsRepository form not found.');
		}
		let schedule = this.mapToEntityAndValidate(template, existingSchedule);
		const serviceProvider = await this.serviceProvidersRepository.getServiceProvider({
			id: template.serviceProviderId,
		});
		await this.verifyActionPermission(serviceProvider, CrudAction.Update);
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
