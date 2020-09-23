import { Inject, InRequestScope } from 'typescript-ioc';
import { Service } from '../../models';
import { RepositoryBase } from '../../core/repository';
import { SchedulesRepository } from '../schedules/schedules.repository';
import { TimeslotsScheduleRepository } from '../timeslotsSchedules/timeslotsSchedule.repository';
import { UserContext } from '../../infrastructure/auth/userContext';
import { SelectQueryBuilder } from 'typeorm';
import { ServicesQueryAuthVisitor } from './services.auth';

@InRequestScope
export class ServicesRepository extends RepositoryBase<Service> {
	@Inject
	private userContext: UserContext;
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

	public async getServiceWithSchedule(id: number): Promise<Service> {
		const query = await this.getServiceQueryById(id);
		const entry = await query.getOne();
		return this.scheduleRepository.populateSingleEntrySchedule(entry);
	}

	public async getServiceWithTimeslotsSchedule(id: number): Promise<Service> {
		const query = await this.getServiceQueryById(id);
		const entry = await query.getOne();

		entry.timeslotsSchedule = await this.timeslotsScheduleRepository.getTimeslotsScheduleById(
			entry?.timeslotsScheduleId,
		);
		return entry;
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

	public async getService(id: number): Promise<Service> {
		const query = await this.getServiceQueryById(id);
		const entry = await query.getOne();
		return entry;
	}
}
