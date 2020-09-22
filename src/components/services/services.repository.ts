import { Inject, InRequestScope } from 'typescript-ioc';
import { Service } from '../../models';
import { RepositoryBase } from '../../core/repository';
import { SchedulesRepository } from '../schedules/schedules.repository';
import { TimeslotsScheduleRepository } from '../timeslotsSchedules/timeslotsSchedule.repository';

@InRequestScope
export class ServicesRepository extends RepositoryBase<Service> {
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

	public async getServiceWithSchedule(id: number): Promise<Service> {
		const entry = await this.getService(id);
		return this.scheduleRepository.populateSingleEntrySchedule(entry);
	}

	public async getServiceWithTimeslotsSchedule(id: number): Promise<Service> {
		const entry = await this.getService(id);
		entry.timeslotsSchedule = await this.timeslotsScheduleRepository.getTimeslotsScheduleById(
			entry.timeslotsScheduleId,
		);
		return entry;
	}

	public async getAll(): Promise<Service[]> {
		return (await this.getRepository()).find();
	}

	public async getService(id: number): Promise<Service> {
		return (await this.getRepository()).findOne(id);
	}

	public async getServicesForUserGroups(serviceInfos: ServiceRefInfo[]): Promise<Service[]> {
		if (!serviceInfos || serviceInfos.length === 0) {
			return [];
		}

		const references = serviceInfos.map((r) => `${r.serviceRef}:${r.organisationRef}`);

		const repository = await this.getRepository();
		// *** Don't filter by user permission here, as this is used by UserContext class
		const query = repository
			.createQueryBuilder('svc')
			.innerJoinAndSelect(
				'svc._serviceAdminGroupMap',
				'svcgroup',
				'svcgroup."_serviceOrganisationRef" IN (:...references)',
				{
					references,
				},
			);

		return await query.getMany();
	}
}

export type ServiceRefInfo = {
	serviceRef: string;
	organisationRef: string;
};
