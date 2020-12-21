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

	public async save(service: Service): Promise<Service> {
		const repository = await this.getRepository();
		const serviceFound = await repository
			.createQueryBuilder('s')
			.innerJoinAndSelect('s._organisation', 'org', 'org."_name" = :orgName', {
				orgName: service.organisation.name,
			})
			.innerJoinAndSelect('s._serviceAdminGroupMap', 'srvAdminGroupMap')
			.andWhere('s._name = :name', { name: service.name })
			.getOne();

		if (serviceFound) {
			service.id = serviceFound?.id;
			service.organisation = serviceFound?.organisation;
			service.organisationId = serviceFound?.organisation.id;
			service.serviceAdminGroupMap.serviceId = serviceFound.serviceAdminGroupMap?.serviceId;
		}
		return (await this.getRepository()).save(service);
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
