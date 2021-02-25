import { Inject, InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { OneOffTimeslot } from '../../models';
import { UserContext } from '../../infrastructure/auth/userContext';
import { SelectQueryBuilder } from 'typeorm';
import { andWhere } from '../../tools/queryConditions';
import { OneOffTimeslotsQueryAuthVisitor } from './oneOffTimeslots.auth';

@InRequestScope
export class OneOffTimeslotsRepository extends RepositoryBase<OneOffTimeslot> {
	@Inject
	private userContext: UserContext;

	constructor() {
		super(OneOffTimeslot);
	}

	public async save(data: OneOffTimeslot): Promise<OneOffTimeslot> {
		if (!data) return null;
		const repository = await this.getRepository();
		return await repository.save(data);
	}

	private async createSelectQuery(
		queryFilters: string[],
		queryParams: {},
		options: {
			byPassAuth?: boolean;
		},
	): Promise<SelectQueryBuilder<OneOffTimeslot>> {
		const authGroups = await this.userContext.getAuthGroups();
		const { userCondition, userParams } = options.byPassAuth
			? { userCondition: '', userParams: {} }
			: await new OneOffTimeslotsQueryAuthVisitor('serviceProvider', 'SPservice').createUserVisibilityCondition(
					authGroups,
			  );
		const repository = await this.getRepository();

		return repository
			.createQueryBuilder('timeslot')
			.where(andWhere([userCondition, ...queryFilters]), { ...userParams, ...queryParams })
			.leftJoin('timeslot._serviceProvider', 'serviceProvider')
			.leftJoin('serviceProvider._service', 'SPservice');
	}

	public async getById(request: { id: number; byPassAuth?: boolean }): Promise<OneOffTimeslot> {
		const idCondition = 'timeslot._id = :id';
		const query = await this.createSelectQuery([idCondition], { id: request.id }, request);

		return await query.getOne();
	}

	public async search(request: {
		byPassAuth?: boolean;
		serviceId?: number;
		serviceProviderIds?: number[];
		startDateTime?: Date;
		endDateTime?: Date;
	}): Promise<OneOffTimeslot[]> {
		const { serviceId, serviceProviderIds, startDateTime, endDateTime } = request;

		const serviceCondition = serviceId ? 'SPservice._id = :serviceId' : '';
		const spCondition =
			serviceProviderIds && serviceProviderIds.length > 0
				? 'timeslot."_serviceProviderId" IN (:...serviceProviderIds)'
				: '';
		const startDateCondition = startDateTime ? 'item."_endDateTime" > :startDateTime' : '';
		const endDateCondition = endDateTime ? 'item."_startDateTime" < :endDateTime' : '';

		const query = await this.createSelectQuery(
			[serviceCondition, spCondition, startDateCondition, endDateCondition],
			{ serviceId, serviceProviderIds, startDateTime, endDateTime },
			request,
		);

		return await query.getMany();
	}

	public async delete(timeslot: OneOffTimeslot): Promise<void> {
		const repository = await this.getRepository();
		await repository.delete(timeslot.id);
	}
}
