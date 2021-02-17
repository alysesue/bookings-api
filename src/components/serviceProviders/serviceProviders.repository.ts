import { Inject, InRequestScope } from 'typescript-ioc';
import { ServiceProvider } from '../../models';
import { RepositoryBase } from '../../core/repository';
import { ScheduleFormsRepository } from '../scheduleForms/scheduleForms.repository';
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
	private scheduleRepository: ScheduleFormsRepository;
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
			await this.scheduleRepository.populateScheduleForms(entries);
		}

		if (options.includeTimeslotsSchedule) {
			await this.timeslotsScheduleRepository.populateTimeslotsSchedules(entries);
		}

		return entries;
	}

	private getSpQuery(
		options: {
			ids?: number[];
			serviceId?: number;
			organisationId?: number;
			scheduleFormId?: number;
			includeScheduleForm?: boolean;
			includeTimeslotsSchedule?: boolean;
			skipAuthorisation?: boolean;
			limit?: number;
			pageNumber?: number;
		} = {},
	): Promise<SelectQueryBuilder<ServiceProvider>> {
		const { serviceId, ids, scheduleFormId, organisationId } = options;
		const serviceCondition = serviceId ? 'sp."_serviceId" = :serviceId ' : '';
		const idsCondition = ids && ids.length > 0 ? 'sp._id IN (:...ids)' : '';
		const scheduleFormIdCondition = scheduleFormId ? 'sp._scheduleFormId = :scheduleFormId' : '';
		const organisationIdCondition = organisationId ? 'service._organisationId = :organisationId' : '';

		return this.createSelectQuery(
			[serviceCondition, idsCondition, scheduleFormIdCondition, organisationIdCondition],
			{ serviceId, ids, scheduleFormId, organisationId },
			options,
		);
	}

	public async getServiceProviders(
		options: {
			ids?: number[];
			serviceId?: number;
			organisationId?: number;
			scheduleFormId?: number;
			includeScheduleForm?: boolean;
			includeTimeslotsSchedule?: boolean;
			skipAuthorisation?: boolean;
			limit?: number;
			pageNumber?: number;
		} = {},
	): Promise<ServiceProvider[]> {
		const { limit, pageNumber } = options;
		const query = await this.getSpQuery(options);
		if (limit && pageNumber) {
			query.skip(limit * (pageNumber - 1));
			query.take(limit);
		}
		query.orderBy('sp._name');
		const entries = await query.getMany();
		return await this.processIncludes(entries, options);
	}

	public async getServiceProvidersByName(options: {
		searchKey: string;
		serviceId?: number;
	}): Promise<ServiceProvider[]> {
		const { searchKey, serviceId } = options;

		const serviceCondition = serviceId ? 'sp._serviceId = :serviceId ' : '';
		const nameCondition = searchKey ? 'sp._name ILIKE :name' : '';

		const query = await this.createSelectQuery(
			[serviceCondition, nameCondition],
			{ serviceId, name: `${searchKey}%` },
			{ skipAuthorisation: false },
		);
		query.orderBy('sp._name');
		return await query.getMany();
	}

	public async getServiceProvidersCount(
		options: {
			ids?: number[];
			serviceId?: number;
			organisationId?: number;
			scheduleFormId?: number;
			includeScheduleForm?: boolean;
			includeTimeslotsSchedule?: boolean;
			skipAuthorisation?: boolean;
		} = {},
	): Promise<number> {
		const query = await this.getSpQuery(options);
		return query.getCount();
	}

	public async getByScheduleFormId(options: {
		scheduleFormId: number;
		includeScheduleForm?: boolean;
		includeTimeslotsSchedule?: boolean;
		skipAuthorisation?: boolean;
	}): Promise<ServiceProvider> {
		const { scheduleFormId } = options;
		if (!scheduleFormId) {
			return null;
		}

		const scheduleFormIdCondition = scheduleFormId ? 'sp._scheduleFormId = :scheduleFormId' : '';

		const query = await this.createSelectQuery([scheduleFormIdCondition], { scheduleFormId }, options);
		const entry = await query.getOne();

		if (!entry) {
			return entry;
		}
		return (await this.processIncludes([entry], options))[0];
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
		return repository
			.createQueryBuilder('sp')
			.where(andWhere([userCondition, ...queryFilters]), { ...userParams, ...queryParams })
			.leftJoinAndSelect('sp._serviceProviderGroupMap', 'sp_groupmap')
			.leftJoinAndSelect('sp._service', 'service')
			.leftJoinAndSelect('service._organisation', 'svcOrg');
	}

	public async save(serviceProvider: ServiceProvider): Promise<ServiceProvider> {
		const repository = await this.getRepository();
		return await repository.save(serviceProvider);
	}

	public async saveMany(serviceProviders: ServiceProvider[]): Promise<ServiceProvider[]> {
		const repository = await this.getRepository();
		return await repository.save(serviceProviders);
	}
}
