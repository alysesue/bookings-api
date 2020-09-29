import { Inject, InRequestScope } from 'typescript-ioc';
import { ServiceProvider } from '../../models';
import { RepositoryBase } from '../../core/repository';
import { SchedulesFormRepository } from '../schedulesForm/schedulesForm.repository';
import { TimeslotsScheduleRepository } from '../timeslotsSchedules/timeslotsSchedule.repository';
import { ServiceProvidersQueryAuthVisitor } from './serviceProviders.auth';
import { UserContext } from '../../infrastructure/auth/userContext';
import { andWhere } from '../../tools/queryConditions';
import { SelectQueryBuilder } from 'typeorm';

@InRequestScope
export class ServiceProvidersRepository extends RepositoryBase<ServiceProvider> {
	@Inject
	private userContext: UserContext;
	@Inject
	private scheduleRepository: SchedulesFormRepository;
	@Inject
	private timeslotsScheduleRepository: TimeslotsScheduleRepository;

	constructor() {
		super(ServiceProvider);
	}

	private async processIncludes(
		entries: ServiceProvider[],
		options: {
			includeScheduleForm?: boolean;
			includeTimeslotsSchedule?: boolean;
		},
	): Promise<ServiceProvider[]> {
		if (options.includeScheduleForm) {
			await this.scheduleRepository.populateSchedulesForm(entries);
		}

		if (options.includeTimeslotsSchedule) {
			await this.timeslotsScheduleRepository.populateTimeslotsSchedules(entries);
		}

		return entries;
	}

	private async createSelectQuery(
		queryFilters: string[],
		queryParams: {},
		options: {
			skipAuthorisation?: boolean;
		},
	): Promise<SelectQueryBuilder<ServiceProvider>> {
		const authGroups = await this.userContext.getAuthGroups();
		const { userCondition, userParams } = options.skipAuthorisation
			? { userCondition: '', userParams: {} }
			: await new ServiceProvidersQueryAuthVisitor('sp', 'service').createUserVisibilityCondition(authGroups);

		const repository = await this.getRepository();
		const query = repository
			.createQueryBuilder('sp')
			.where(andWhere([userCondition, ...queryFilters]), { ...userParams, ...queryParams })
			.leftJoin('sp._service', 'service')
			.leftJoinAndSelect('sp._calendar', 'calendar');

		return query;
	}

	public async getServiceProviders(
		options: {
			ids?: number[];
			serviceId?: number;
			includeScheduleForm?: boolean;
			includeTimeslotsSchedule?: boolean;
			skipAuthorisation?: boolean;
		} = {},
	): Promise<ServiceProvider[]> {
		const { serviceId, ids } = options;
		const serviceCondition = serviceId ? 'sp."_serviceId" = :serviceId ' : '';
		const idsCondition = ids && ids.length > 0 ? 'sp._id IN (:...ids)' : '';

		const query = await this.createSelectQuery([serviceCondition, idsCondition], { serviceId, ids }, options);
		const entries = await query.getMany();

		return await this.processIncludes(entries, options);
	}

	public async getServiceProvider(options: {
		id: number;
		includeScheduleForm?: boolean;
		includeTimeslotsSchedule?: boolean;
		skipAuthorisation?: boolean;
	}): Promise<ServiceProvider> {
		const { id } = options;
		if (!id) {
			return null;
		}

		const idCondition = 'sp._id = :id';
		const query = await this.createSelectQuery([idCondition], { id }, options);
		const entry = await query.getOne();

		if (!entry) {
			return entry;
		}
		return (await this.processIncludes([entry], options))[0];
	}

	public async save(serviceProviders: ServiceProvider): Promise<ServiceProvider> {
		return (await this.getRepository()).save(serviceProviders);
	}
}
