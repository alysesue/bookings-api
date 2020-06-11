import { Inject, InRequestScope } from 'typescript-ioc';
import { Service } from "../models";
import { RepositoryBase } from "../core/repository";
import { groupByKeyLastValue } from '../tools/collections';
import { SchedulesRepository } from '../schedules/schedules.repository';

@InRequestScope
export class ServicesRepository extends RepositoryBase<Service> {
	@Inject
	private scheduleRepository: SchedulesRepository;

	constructor() {
		super(Service);
	}

	private async populateSchedules(entries: Service[]): Promise<Service[]> {
		const scheduleIds = entries.map(e => e.scheduleId).filter(id => !!id);
		if (scheduleIds.length === 0) {
			return entries;
		}

		const schedulesById = groupByKeyLastValue(await this.scheduleRepository.getSchedules(scheduleIds), s => s.id);

		for (const service of entries.filter(c => !!c.scheduleId)) {
			service.schedule = schedulesById.get(service.scheduleId);
		}
		return entries;
	}

	private async populateSingleEntrySchedule(entry: Service): Promise<Service> {
		if (!entry) {
			return null;
		}
		return (await this.populateSchedules([entry]))[0];
	}

	public async save(service: Service): Promise<Service> {
		return (await this.getRepository()).save(service);
	}

	public async getServiceWithSchedule(id: number): Promise<Service> {
		const entry = await this.getService(id);
		return this.populateSingleEntrySchedule(entry);
	}

	public async getAll(): Promise<Service[]> {
		return (await this.getRepository()).find();
	}

	public async getService(id: number): Promise<Service> {
		return (await this.getRepository()).findOne(id);
	}
}
