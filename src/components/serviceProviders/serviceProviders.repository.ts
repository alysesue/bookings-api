import { Inject, InRequestScope } from 'typescript-ioc';
import { ServiceProvider } from '../../models';
import { RepositoryBase } from '../../core/repository';
import { FindConditions, In } from 'typeorm';
import { SchedulesRepository } from '../schedules/schedules.repository';
import { TimeslotsScheduleRepository } from '../timeslotsSchedules/timeslotsSchedule.repository';

@InRequestScope
export class ServiceProvidersRepository extends RepositoryBase<ServiceProvider> {
	@Inject
	private scheduleRepository: SchedulesRepository;
	@Inject
	private timeslotsScheduleRepository: TimeslotsScheduleRepository;

	constructor() {
		super(ServiceProvider);
	}

	private async processIncludes(
		entries: ServiceProvider[],
		options: {
			includeSchedule?: boolean;
			includeTimeslotsSchedule?: boolean;
		},
	): Promise<ServiceProvider[]> {
		if (options.includeSchedule) {
			await this.scheduleRepository.populateSchedules(entries);
		}

		if (options.includeTimeslotsSchedule) {
			await this.timeslotsScheduleRepository.populateTimeslotsSchedules(entries);
		}

		return entries;
	}

	public async getServiceProviders(
		options: {
			ids?: number[];
			serviceId?: number;
			includeSchedule?: boolean;
			includeTimeslotsSchedule?: boolean;
		} = {},
	): Promise<ServiceProvider[]> {
		const findConditions: FindConditions<ServiceProvider> = {};
		if (options.serviceId) {
			findConditions['_serviceId'] = options.serviceId;
		}
		if (options.ids) {
			findConditions['_id'] = In(options.ids);
		}
		const repository = await this.getRepository();
		const entries = await repository.find({ where: [findConditions], relations: ['_calendar'] });

		return await this.processIncludes(entries, options);
	}

	public async getServiceProvider(options: {
		id: number;
		includeSchedule?: boolean;
		includeTimeslotsSchedule?: boolean;
	}): Promise<ServiceProvider> {
		if (!options.id) {
			return null;
		}
		const repository = await this.getRepository();
		const entry = await repository.findOne(options.id, { relations: ['_calendar'] });
		if (!entry) {
			return entry;
		}

		return (await this.processIncludes([entry], options))[0];
	}

	public async save(serviceProviders: ServiceProvider): Promise<ServiceProvider> {
		return (await this.getRepository()).save(serviceProviders);
	}
}
