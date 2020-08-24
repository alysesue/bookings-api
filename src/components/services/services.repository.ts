import { Inject, InRequestScope } from 'typescript-ioc';
import { Service } from "../../models";
import { RepositoryBase } from "../../core/repository";
import { SchedulesRepository } from '../schedules/schedules.repository';
import { TimeslotsScheduleRepository } from '../timeslotsSchedules/timeslotsSchedule.repository';

@InRequestScope
export class ServicesRepository extends RepositoryBase<Service> {
	@Inject
	private scheduleRepository: SchedulesRepository;
	@Inject
	private timeslotsScheduleRepository: TimeslotsScheduleRepository;

	constructor() {
		super(Service);
	}

	public async save(service: Service): Promise<Service> {
		return (await this.getRepository()).save(service);
	}

	public async getServiceWithSchedule(id: number): Promise<Service> {
		const entry = await this.getService(id);
		return this.scheduleRepository.populateSingleEntrySchedule(entry);
	}

	public async getServiceWithTimeslotsSchedule(id: number): Promise<Service> {
		const entry = await this.getService(id);
		entry.timeslotsSchedule = await this.timeslotsScheduleRepository.getTimeslotsScheduleById(entry.timeslotsScheduleId);
		return entry;
	}

	public async getAll(): Promise<Service[]> {
		return (await this.getRepository()).find();
	}

	public async getService(id: number): Promise<Service> {
		return (await this.getRepository()).findOne(id);
	}
}
