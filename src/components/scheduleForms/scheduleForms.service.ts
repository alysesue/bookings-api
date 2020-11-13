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
import { ScheduleFormsRepository } from './scheduleForms.repository';
import { TransactionManager } from '../../core/transactionManager';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { TimeslotsScheduleRepository } from '../timeslotsSchedules/timeslotsSchedule.repository';
import { TimeslotItemsRepository } from '../timeslotItems/timeslotItems.repository';

const FormIsolationLevel: IsolationLevel = 'READ COMMITTED';

@InRequestScope
export class ScheduleFormsService {
	@Inject
	private scheduleFormsRepository: ScheduleFormsRepository;
	@Inject
	private timeslotsScheduleRepository: TimeslotsScheduleRepository;
	@Inject
	private transactionManager: TransactionManager;
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
		saveEntity: (entity: T) => Promise<T>,
	): Promise<T> {
		return this.transactionManager.runInTransaction(FormIsolationLevel, () =>
			this.updateScheduleFormTransactional(template, entity, saveEntity),
		);
	}

	private async updateScheduleFormTransactional<T extends IEntityWithScheduleForm & IEntityWithTimeslotsSchedule>(
		template: ScheduleFormRequest,
		entity: T,
		saveEntity: (entity: T) => Promise<T>,
	): Promise<T> {
		if (entity instanceof ServiceProvider) {
			await this.verifyActionPermission(entity, CrudAction.Update);
		}
		const oldScheduleFormId = entity.scheduleFormId;
		const oldTimeslotsScheduleId = entity.timeslotsScheduleId;

		const scheduleForm = new ScheduleForm();
		this.mapToEntityAndValidate(template, scheduleForm);
		entity.scheduleForm = scheduleForm;

		const timeslotsSchedule = TimeslotsSchedule.create(
			entity instanceof Service ? entity : undefined,
			entity instanceof ServiceProvider ? entity : undefined,
		);

		timeslotsSchedule.timeslotItems = TimeslotItem.generateTimeslotsItems(scheduleForm, entity.timeslotsScheduleId);
		entity.timeslotsSchedule = timeslotsSchedule;

		// saveScheduleForm also saves breaks
		await this.scheduleFormsRepository.saveScheduleForm(scheduleForm);
		const saved = await saveEntity(entity);

		if (oldScheduleFormId) {
			await this.scheduleFormsRepository.deleteScheduleForm(oldScheduleFormId);
		}
		if (oldTimeslotsScheduleId) {
			await this.timeslotsScheduleRepository.deleteTimeslotsSchedule(oldTimeslotsScheduleId);
		}

		return saved;
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
