import { Inject, InRequestScope } from 'typescript-ioc';
import { DeleteResult, SelectQueryBuilder } from 'typeorm';
import { ScheduleForm, WeekDaySchedule } from '../../models';
import { groupByKey, groupByKeyLastValue } from '../../tools/collections';
import { RepositoryBase } from '../../core/repository';
import { IEntityWithScheduleForm } from '../../models/interfaces';
import { UserContext } from '../../infrastructure/auth/userContext';
import { andWhere } from '../../tools/queryConditions';
import { ScheduleFormsQueryAuthVisitor } from './scheduleForms.auth';
import { WeekDayBreakRepository } from './weekdaybreak.repository';

@InRequestScope
export class ScheduleFormsRepository extends RepositoryBase<ScheduleForm> {
	@Inject
	private weekDayBreakRepo: WeekDayBreakRepository;
	@Inject
	private userContext: UserContext;

	constructor() {
		super(ScheduleForm);
	}

	private async querySelectScheduleForm(ids: number[]): Promise<SelectQueryBuilder<ScheduleForm>> {
		const idCondition = ids ? '"scheduleForm"."id" IN (:...ids)' : ' TRUE ';
		const authGroups = await this.userContext.getAuthGroups();
		const { userCondition, userParams } = await new ScheduleFormsQueryAuthVisitor(
			'SPService',
			'serviceProvider',
		).createUserVisibilityCondition(authGroups);

		const repository = await this.getRepository();
		return repository
			.createQueryBuilder('scheduleForm')
			.where(andWhere([userCondition, idCondition]), {
				...userParams,
				ids,
			})
			.leftJoinAndSelect('scheduleForm.weekdaySchedules', 'weekdaySchedules')
			.leftJoinAndSelect('scheduleForm.serviceProvider', 'serviceProvider')
			.leftJoinAndSelect('serviceProvider._service', 'SPService');
	}

	public async getScheduleFormById(id: number): Promise<ScheduleForm> {
		const query = await this.querySelectScheduleForm([id]);
		const scheduleForm = await query.getOne();
		return scheduleForm ? (await this.populateBreaks([scheduleForm]))[0] : null;
	}

	public async getScheduleForms(ids?: number[]): Promise<ScheduleForm[]> {
		const query = await this.querySelectScheduleForm(ids);
		const schedules = await query.getMany();
		return this.populateBreaks(schedules);
	}

	private async populateBreaks(schedules: ScheduleForm[]): Promise<ScheduleForm[]> {
		if (!schedules.length) {
			return null;
		}
		const scheduleIds = schedules.map((s) => s.id);
		const breaks = await this.weekDayBreakRepo.getBreaksForSchedules(scheduleIds);
		const breaksPerSchedule = groupByKey(breaks, (e) => e.getScheduleId());

		for (const scheduleForm of schedules) {
			const scheduleBreaks = breaksPerSchedule.get(scheduleForm.id) || [];
			scheduleForm.setBreaks(scheduleBreaks);
		}

		return schedules;
	}

	public async saveScheduleForm(scheduleForm: ScheduleForm): Promise<ScheduleForm> {
		const breaks = scheduleForm.getAllBreaks();
		const saved = await (await this.getRepository()).save(scheduleForm);

		if (scheduleForm.id > 0) {
			await this.weekDayBreakRepo.deleteBreaksForSchedule(scheduleForm.id);
		}
		const savedBreaks = await this.weekDayBreakRepo.save(breaks);

		saved.setBreaks(savedBreaks);
		return saved;
	}

	public async deleteScheduleForm(scheduleFormId: number): Promise<DeleteResult> {
		const repository = await this.getRepository();
		await repository
			.createQueryBuilder()
			.delete()
			.from(WeekDaySchedule)
			.where('scheduleFormId = :scheduleFormId', { scheduleFormId })
			.execute();

		await this.weekDayBreakRepo.deleteBreaksForSchedule(scheduleFormId);
		return repository.delete(scheduleFormId);
	}

	public async populateScheduleForms<T extends IEntityWithScheduleForm>(entries: T[]): Promise<T[]> {
		const scheduleFormIds = entries.map((e) => e.scheduleFormId).filter((id) => !!id);
		if (scheduleFormIds.length === 0) {
			return entries;
		}

		const scheduleFormsById = groupByKeyLastValue(await this.getScheduleForms(scheduleFormIds), (s) => s.id);

		for (const entry of entries.filter((c) => !!c.scheduleFormId)) {
			entry.scheduleForm = scheduleFormsById.get(entry.scheduleFormId);
		}
		return entries;
	}

	public async populateSingleEntryScheduleForm<T extends IEntityWithScheduleForm>(entry: T): Promise<T> {
		if (!entry) {
			return entry;
		}

		return (await this.populateScheduleForms([entry]))[0];
	}
}
