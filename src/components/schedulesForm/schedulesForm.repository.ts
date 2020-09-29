import { Inject, InRequestScope } from 'typescript-ioc';
import { ScheduleForm } from '../../models';
import { DeleteResult, FindManyOptions, In } from 'typeorm';
import { groupByKey } from '../../tools/collections';
import { WeekDayBreakRepository } from './weekdaybreak.repository';
import { RepositoryBase } from '../../core/repository';
import { groupByKeyLastValue } from '../../tools/collections';
import { IEntityWithScheduleForm } from '../../models/interfaces';

@InRequestScope
export class SchedulesFormRepository extends RepositoryBase<ScheduleForm> {
	@Inject
	private weekDayBreakRepo: WeekDayBreakRepository;

	constructor() {
		super(ScheduleForm);
	}

	public async getScheduleFormById(id: number): Promise<ScheduleForm> {
		const scheduleForm = await (await this.getRepository()).findOne(id, {
			relations: ['weekdaySchedules'],
		});
		return this.populateSingleEntryBreaks(scheduleForm);
	}

	public async getSchedulesForm(ids?: number[]): Promise<ScheduleForm[]> {
		const options: FindManyOptions<ScheduleForm> = { relations: ['weekdaySchedules'] };
		if (ids) {
			options.where = { id: In(ids) };
		}

		const schedules = await (await this.getRepository()).find(options);
		return this.populateBreaks(schedules);
	}

	public async getScheduleFormByName(name: string): Promise<ScheduleForm> {
		const scheduleForm = await (await this.getRepository()).findOne({
			where: { name },
			relations: ['weekdaySchedules'],
		});
		return this.populateSingleEntryBreaks(scheduleForm);
	}

	private async populateSingleEntryBreaks(scheduleForm: ScheduleForm): Promise<ScheduleForm> {
		if (!scheduleForm) {
			return null;
		}
		return (await this.populateBreaks([scheduleForm]))[0];
	}

	private async populateBreaks(schedules: ScheduleForm[]): Promise<ScheduleForm[]> {
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
		await this.weekDayBreakRepo.deleteBreaksForSchedule(scheduleFormId);
		return (await this.getRepository()).delete(scheduleFormId);
	}

	public async populateSchedulesForm<T extends IEntityWithScheduleForm>(entries: T[]): Promise<T[]> {
		const scheduleFormIds = entries.map((e) => e.scheduleFormId).filter((id) => !!id);
		if (scheduleFormIds.length === 0) {
			return entries;
		}

		const scheduleFormsById = groupByKeyLastValue(await this.getSchedulesForm(scheduleFormIds), (s) => s.id);

		for (const entry of entries.filter((c) => !!c.scheduleFormId)) {
			entry.scheduleForm = scheduleFormsById.get(entry.scheduleFormId);
		}
		return entries;
	}

	public async populateSingleEntryScheduleForm<T extends IEntityWithScheduleForm>(entry: T): Promise<T> {
		if (!entry) {
			return entry;
		}

		return (await this.populateSchedulesForm([entry]))[0];
	}
}
