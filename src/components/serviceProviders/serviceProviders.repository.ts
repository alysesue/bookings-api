import { Inject, InRequestScope } from 'typescript-ioc';
import { ServiceProvider } from '../../models';
import { RepositoryBase } from '../../core/repository';
import { ScheduleFormsRepository } from '../scheduleForms/scheduleForms.repository';
import { TimeslotsScheduleRepository } from '../timeslotsSchedules/timeslotsSchedule.repository';
import { ServiceProvidersQueryAuthVisitor } from './serviceProviders.auth';
import { UserContext } from '../../infrastructure/auth/userContext';
import { andWhere } from '../../tools/queryConditions';
import { SelectQueryBuilder } from 'typeorm';
import { UsersRepository } from '../users/users.repository';
import { groupByKeyLastValue } from '../../tools/collections';

@InRequestScope
export class ServiceProvidersRepository extends RepositoryBase<ServiceProvider> {
	@Inject
	private userContext: UserContext;
	@Inject
	private scheduleRepository: ScheduleFormsRepository;
	@Inject
	private timeslotsScheduleRepository: TimeslotsScheduleRepository;
	@Inject
	private usersRepository: UsersRepository;

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

		await this.includeLinkedUsers(entries);
		return entries;
	}

	private async includeLinkedUsers(entries: ServiceProvider[]): Promise<void> {
		const entriesWithMolAdminId = entries.filter((e) => !!e._serviceProviderGroupMap?.molAdminId);
		const molAdminIds = entriesWithMolAdminId.map((e) => e._serviceProviderGroupMap.molAdminId);

		const users = await this.usersRepository.getUsersByMolAdminIds(molAdminIds);
		const usersByMolAdminId = groupByKeyLastValue(users, (u) => u.adminUser.molAdminId);
		for (const entry of entries) {
			const molAdminId = entry._serviceProviderGroupMap?.molAdminId;
			entry.linkedUser = molAdminId ? usersByMolAdminId.get(molAdminId) || null : null;
		}
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
		id?: number;
		includeScheduleForm?: boolean;
		includeTimeslotsSchedule?: boolean;
		skipAuthorisation?: boolean;
		idScheduleForm?: number;
	}): Promise<ServiceProvider> {
		const { id, idScheduleForm } = options;
		if (!id) {
			return null;
		}

		const idCondition = id ? 'sp._id = :id' : '';
		const idScheduleFormCondition = idScheduleForm ? 'sp._scheduleFormId = :idScheduleForm ' : '';
		const query = await this.createSelectQuery([idCondition, idScheduleFormCondition], { id }, options);
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
			.leftJoinAndSelect('sp._service', 'service');
	}

	public async save(serviceProviders: ServiceProvider): Promise<ServiceProvider> {
		return (await this.getRepository()).save(serviceProviders);
	}
}
