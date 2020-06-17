import { Inject, InRequestScope } from "typescript-ioc";
import { ServiceProvider } from "../models";
import { RepositoryBase } from "../core/repository";
import { FindConditions } from "typeorm";
import { SchedulesRepository } from '../schedules/schedules.repository';

@InRequestScope
export class ServiceProvidersRepository extends RepositoryBase<ServiceProvider> {
	@Inject
	private scheduleRepository: SchedulesRepository;

	constructor() {
		super(ServiceProvider);
	}

	public async getServiceProviders(options: { serviceId?: number, includeSchedule?: boolean } = {}): Promise<ServiceProvider[]> {
		const findConditions: FindConditions<ServiceProvider> = {};
		if (options.serviceId) {
			findConditions['_serviceId'] = options.serviceId;
		}
		const repository = await this.getRepository();
		const entries = await repository.find({ where: [findConditions], relations: ['_calendar'] });
		return options.includeSchedule ? await this.scheduleRepository.populateSchedules(entries)
			: entries;
	}

	public async getServiceProvider(options: { id: number, includeSchedule?: boolean }): Promise<ServiceProvider> {
		const repository = await this.getRepository();
		const entry = await repository.findOne(options.id, { relations: ['_calendar'] });
		return options.includeSchedule ? await this.scheduleRepository.populateSingleEntrySchedule(entry)
			: entry;
	}

	public async save(serviceProviders: ServiceProvider): Promise<ServiceProvider> {
		return (await this.getRepository()).save(serviceProviders);
	}
}
