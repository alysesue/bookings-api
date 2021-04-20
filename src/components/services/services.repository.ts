import { Inject, InRequestScope } from 'typescript-ioc';
import { SelectQueryBuilder } from 'typeorm';
import { Service } from '../../models';
import { RepositoryBase } from '../../core/repository';
import { ScheduleFormsRepository } from '../scheduleForms/scheduleForms.repository';
import { TimeslotsScheduleRepository } from '../timeslotsSchedules/timeslotsSchedule.repository';
import { UserContext } from '../../infrastructure/auth/userContext';
import { andWhere } from '../../tools/queryConditions';
import { ServicesQueryAuthVisitor } from './services.auth';

@InRequestScope
export class ServicesRepository extends RepositoryBase<Service> {
	@Inject
	private userContext: UserContext;
	@Inject
	private scheduleFormRepository: ScheduleFormsRepository;
	@Inject
	private timeslotsScheduleRepository: TimeslotsScheduleRepository;

	constructor() {
		super(Service);
	}

	private async processIncludes(
		entries: Service[],
		options: {
			includeScheduleForm?: boolean;
			includeTimeslotsSchedule?: boolean;
		},
	): Promise<Service[]> {
		if (options.includeScheduleForm) {
			await this.scheduleFormRepository.populateScheduleForms(entries);
		}

		if (options.includeTimeslotsSchedule) {
			await this.timeslotsScheduleRepository.populateTimeslotsSchedules(entries, {});
		}

		return entries;
	}

	private async createSelectQuery(
		queryFilters: string[],
		queryParams: {},
		options: {
			skipAuthorisation?: boolean;
		},
	): Promise<SelectQueryBuilder<Service>> {
		const authGroups = await this.userContext.getAuthGroups();
		const { userCondition, userParams } = options.skipAuthorisation
			? { userCondition: '', userParams: {} }
			: await new ServicesQueryAuthVisitor('svc').createUserVisibilityCondition(authGroups);

		const repository = await this.getRepository();
		return repository
			.createQueryBuilder('svc')
			.where(andWhere([userCondition, ...queryFilters]), { ...userParams, ...queryParams })
			.leftJoinAndSelect('svc._serviceAdminGroupMap', 'svcAdminGroupMap')
			.leftJoinAndSelect('svc._organisation', 'svcOrg')
			.leftJoinAndSelect('svc.labels', 'svcLabels');
	}

	public async getServicesByName(options: {
		names: string[];
		organisationId: number;
		skipAuthorisation?: boolean;
	}): Promise<Service[]> {
		const { names, organisationId } = options;
		if (names.length === 0) {
			return [];
		}

		const orgCondition = 'svc."_organisationId" = :organisationId';
		const namesCondition = 'svc._name IN (:...names)';

		const query = await this.createSelectQuery([orgCondition, namesCondition], { organisationId, names }, options);
		return await query.getMany();
	}

	public async save(service: Service): Promise<Service> {
		return (await this.getRepository()).save(service);
	}

	public async saveMany(services: Service[]): Promise<Service[]> {
		return (await this.getRepository()).save(services);
	}

	private async getServiceQueryById(id: number): Promise<SelectQueryBuilder<Service>> {
		const idCondition = 'svc._id = :id';

		return await this.createSelectQuery([idCondition], { id }, {});
	}

	public async getServiceWithScheduleForm(id: number): Promise<Service> {
		const query = await this.getServiceQueryById(id);
		const entry = await query.getOne();
		return this.scheduleFormRepository.populateSingleEntryScheduleForm(entry);
	}

	public async getServiceWithTimeslotsSchedule(id: number): Promise<Service> {
		return this.getService({
			id,
			includeTimeslotsSchedule: true,
		});
	}

	public async getAll(): Promise<Service[]> {
		const query = await this.createSelectQuery([], {}, {});

		return await query.getMany();
	}

	public async getService(options: {
		id: number;
		includeScheduleForm?: boolean;
		includeTimeslotsSchedule?: boolean;
	}): Promise<Service> {
		const { id } = options;
		const query = await this.getServiceQueryById(id);
		const entry = await query.getOne();

		if (!entry) {
			return entry;
		}
		return (await this.processIncludes([entry], options))[0];
	}
}
