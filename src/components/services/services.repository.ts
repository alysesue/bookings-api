import { Inject, InRequestScope } from 'typescript-ioc';
import { Service } from '../../models';
import { RepositoryBase } from '../../core/repository';
import { ScheduleFormsRepository } from '../scheduleForms/scheduleForms.repository';
import { TimeslotsScheduleRepository } from '../timeslotsSchedules/timeslotsSchedule.repository';
import { UserContext } from '../../infrastructure/auth/userContext';
import { SelectQueryBuilder } from 'typeorm';
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
			await this.timeslotsScheduleRepository.populateTimeslotsSchedules(entries);
		}

		return entries;
	}

	public async getServicesByName({
		names,
		organisationId,
	}: {
		names: string[];
		organisationId: number;
	}): Promise<Service[]> {
		if (names.length === 0) {
			return [];
		}

		const authGroups = await this.userContext.getAuthGroups();
		const { userCondition, userParams } = await new ServicesQueryAuthVisitor('svc').createUserVisibilityCondition(
			authGroups,
		);

		const repository = await this.getRepository();
		const orgCondition = 'svc."_organisationId" = :organisationId';
		const namesCondition = 'svc._name IN (:...names)';

		const query = repository
			.createQueryBuilder('svc')
			.where(
				[userCondition, orgCondition, namesCondition]
					.filter((c) => c)
					.map((c) => `(${c})`)
					.join(' AND '),
				{ ...userParams, organisationId, names },
			)
			.leftJoinAndSelect('svc._serviceAdminGroupMap', 'svcAdminGroupMap');

		return await query.getMany();
	}

	public async save(service: Service): Promise<Service> {
		return (await this.getRepository()).save(service);
	}

	public async saveMany(services: Service[]): Promise<Service[]> {
		return (await this.getRepository()).save(services);
	}

	private async getServiceQueryById(id: number): Promise<SelectQueryBuilder<Service>> {
		const authGroups = await this.userContext.getAuthGroups();
		const { userCondition, userParams } = await new ServicesQueryAuthVisitor('svc').createUserVisibilityCondition(
			authGroups,
		);

		const repository = await this.getRepository();
		const idCondition = 'svc._id = :id';
		const query = repository.createQueryBuilder('svc').where(
			[userCondition, idCondition]
				.filter((c) => c)
				.map((c) => `(${c})`)
				.join(' AND '),
			{ ...userParams, id },
		);
		return query;
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
		const authGroups = await this.userContext.getAuthGroups();
		const { userCondition, userParams } = await new ServicesQueryAuthVisitor('svc').createUserVisibilityCondition(
			authGroups,
		);

		const repository = await this.getRepository();
		const query = repository.createQueryBuilder('svc').where(userCondition, { ...userParams });

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
