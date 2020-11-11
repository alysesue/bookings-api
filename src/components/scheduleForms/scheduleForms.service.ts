import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { Inject, InRequestScope } from 'typescript-ioc';
import { ScheduleForm, Service, ServiceProvider, TimeslotItem, TimeslotsSchedule } from '../../models';
import { ScheduleFormRequest } from './scheduleForms.apicontract';
import { mapToEntity } from './scheduleForms.mapper';
import { getErrorResult, isErrorResult } from '../../errors';
import { UserContext } from '../../infrastructure/auth/userContext';
import { ScheduleFormsActionAuthVisitor } from './scheduleForms.auth';
import { CrudAction } from '../../enums/crudAction';
import { IEntityWithScheduleForm, IEntityWithTimeslotsSchedule } from '../../models/interfaces';

@InRequestScope
export class ScheduleFormsService {
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

	public async updateScheduleFormInEntity<T extends IEntityWithScheduleForm & IEntityWithTimeslotsSchedule>(
		template: ScheduleFormRequest,
		entity: T,
	): Promise<T> {
		if (entity instanceof ServiceProvider) {
			await this.verifyActionPermission(entity, CrudAction.Update);
		}

		const scheduleForm = (entity.scheduleForm as ScheduleForm) || new ScheduleForm();

		// TODO: test existing dependencies are cleared after updating - WeekDaySchedule
		scheduleForm.reset();
		this.mapToEntityAndValidate(template, scheduleForm);
		entity.scheduleForm = scheduleForm;

		const timeslotsSchedule =
			(entity.timeslotsSchedule as TimeslotsSchedule) ||
			TimeslotsSchedule.create(
				entity instanceof Service ? entity : undefined,
				entity instanceof ServiceProvider ? entity : undefined,
			);

		timeslotsSchedule.timeslotItems = TimeslotItem.generateTimeslotsItems(scheduleForm, entity.timeslotsScheduleId);
		entity.timeslotsSchedule = timeslotsSchedule;

		// TODO: test existing dependencies are cleared after updating - TimeslotItem
		return entity;
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
