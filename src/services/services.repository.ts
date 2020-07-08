import { Inject, InRequestScope } from 'typescript-ioc';
import { Service } from "../models";
import { RepositoryBase } from "../core/repository";
import { SchedulesRepository } from '../schedules/schedules.repository';
import { TimeslotItemsRepository } from '../timeslotItems/timeslotItems.repository';

@InRequestScope
export class ServicesRepository extends RepositoryBase<Service> {
	@Inject
	private scheduleRepository: SchedulesRepository;
	@Inject
	private timeslotItemsRepository: TimeslotItemsRepository;

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
		entry._timeslotsSchedule = await this.timeslotItemsRepository.getTimeslotsScheduleById(entry._timeslotsScheduleId);
		return entry;
	}

	public async getAll(): Promise<Service[]> {
		return (await this.getRepository()).find();
	}

	public async getService(id: number): Promise<Service> {
		return (await this.getRepository()).findOne(id);
	}
}
