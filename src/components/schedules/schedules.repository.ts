import { Inject, InRequestScope } from 'typescript-ioc';
import { Schedule } from '../../models';
import { DeleteResult, FindManyOptions, In } from "typeorm";
import { groupByKey } from '../../tools/collections';
import { WeekDayBreakRepository } from './weekdaybreak.repository';
import { RepositoryBase } from '../../core/repository';
import { groupByKeyLastValue } from '../../tools/collections';
import { IEntityWithSchedule } from '../../models/interfaces';

@InRequestScope
export class SchedulesRepository extends RepositoryBase<Schedule> {
	@Inject
	private weekDayBreakRepo: WeekDayBreakRepository;

	constructor() {
		super(Schedule);
	}

	public async getScheduleById(id: number): Promise<Schedule> {
		const schedule = await (await this.getRepository()).findOne(id, {
			relations: ['weekdaySchedules']
		});
		return this.populateSingleEntryBreaks(schedule);
	}

	public async getSchedules(ids?: number[]): Promise<Schedule[]> {
		const options: FindManyOptions<Schedule> = { relations: ['weekdaySchedules'] };
		if (ids) {
			options.where = { id: In(ids) };
		}

		const schedules = await (await this.getRepository()).find(options);
		return this.populateBreaks(schedules);
	}

	public async getScheduleByName(name: string): Promise<Schedule> {
		const schedule = await (await this.getRepository()).findOne({
			where: { name },
			relations: ['weekdaySchedules']
		});
		return this.populateSingleEntryBreaks(schedule);
	}

	private async populateSingleEntryBreaks(schedule: Schedule): Promise<Schedule> {
		if (!schedule) {
			return null;
		}
		return (await this.populateBreaks([schedule]))[0];
	}

	private async populateBreaks(schedules: Schedule[]): Promise<Schedule[]> {
		const scheduleIds = schedules.map(s => s.id);
		const breaks = await this.weekDayBreakRepo.getBreaksForSchedules(scheduleIds);
		const breaksPerSchedule = groupByKey(breaks, e => e.getScheduleId());

		for (const schedule of schedules) {
			const scheduleBreaks = breaksPerSchedule.get(schedule.id) || [];
			schedule.setBreaks(scheduleBreaks);
		}

		return schedules;
	}

	public async saveSchedule(schedule: Schedule): Promise<Schedule> {
		const breaks = schedule.getAllBreaks();
		const saved = await (await this.getRepository()).save(schedule);

		if (schedule.id > 0) {
			await this.weekDayBreakRepo.deleteBreaksForSchedule(schedule.id);
		}
		const savedBreaks = await this.weekDayBreakRepo.save(breaks);

		saved.setBreaks(savedBreaks);
		return saved;
	}

	public async deleteSchedule(scheduleId: number): Promise<DeleteResult> {
		await this.weekDayBreakRepo.deleteBreaksForSchedule(scheduleId);
		return (await this.getRepository()).delete(scheduleId);
	}

	public async populateSchedules<T extends IEntityWithSchedule>(entries: T[]): Promise<T[]> {
		const scheduleIds = entries.map(e => e.scheduleId).filter(id => !!id);
		if (scheduleIds.length === 0) {
			return entries;
		}

		const schedulesById = groupByKeyLastValue(await this.getSchedules(scheduleIds), s => s.id);

		for (const entry of entries.filter(c => !!c.scheduleId)) {
			entry.schedule = schedulesById.get(entry.scheduleId);
		}
		return entries;
	}

	public async populateSingleEntrySchedule<T extends IEntityWithSchedule>(entry: T): Promise<T> {
		if (!entry) {
			return entry;
		}

		return (await this.populateSchedules([entry]))[0];
	}
}
