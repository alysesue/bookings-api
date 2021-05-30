import { Inject, InRequestScope } from 'typescript-ioc';
import { SelectQueryBuilder } from 'typeorm';
import { Service } from '../../models';
import { RepositoryBase } from '../../core/repository';
import { ScheduleFormsRepository } from '../scheduleForms/scheduleForms.repository';
import { TimeslotsScheduleRepository } from '../timeslotsSchedules/timeslotsSchedule.repository';
import { UserContext } from '../../infrastructure/auth/userContext';
import { andWhere } from '../../tools/queryConditions';
import { ServicesQueryAuthVisitor } from './services.auth';
import { LabelsRepository } from '../labels/labels.repository';
import { LabelsCategoriesRepository } from "../labelsCategories/labelsCategories.repository";

@InRequestScope
export class ServicesRepository extends RepositoryBase<Service> {
	@Inject
	private userContext: UserContext;
	@Inject
	private scheduleFormRepository: ScheduleFormsRepository;
	@Inject
	private timeslotsScheduleRepository: TimeslotsScheduleRepository;
	@Inject
	private labelsCategoriesRepository: LabelsCategoriesRepository;
	@Inject
	private labelsRepository: LabelsRepository;

	constructor() {
		super(Service);
	}

	private async processIncludes(
		entries: Service[],
		options: {
			includeScheduleForm?: boolean;
			includeTimeslotsSchedule?: boolean;
			includeLabels?: boolean;
			includeLabelCategories?: boolean;
		},
	): Promise<Service[]> {
		if (options.includeScheduleForm) {
			await this.scheduleFormRepository.populateScheduleForms(entries);
		}

		if (options.includeTimeslotsSchedule) {
			await this.timeslotsScheduleRepository.populateTimeslotsSchedules(entries, {});
		}

		if (options.includeLabels) {
			await this.labelsRepository.populateLabelForService(entries);
		}
		if (options.includeLabelCategories) {
			await this.labelsCategoriesRepository.populateCategories(entries);
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
			.leftJoinAndSelect('svc._organisation', 'svcOrg');
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

	public async getAll(options: {
		includeScheduleForm?: boolean;
		includeTimeslotsSchedule?: boolean;
		includeLabels?: boolean;
		includeLabelCategories?: boolean;
	}): Promise<Service[]> {
		const query = await this.createSelectQuery([], {}, {});

		const entries = await query.getMany();
		if (!entries) {
			return entries;
		}
		return (await this.processIncludes(entries, options));
	}

	public async getService(options: {
		id: number;
		includeScheduleForm?: boolean;
		includeTimeslotsSchedule?: boolean;
		includeLabels?: boolean;
		includeLabelCategories?: boolean;
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
