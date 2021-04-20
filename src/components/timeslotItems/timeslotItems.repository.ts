import { DeleteResult } from 'typeorm';
import { Inject, InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { TimeslotItem } from '../../models';
import { UserContext } from '../../infrastructure/auth/userContext';
import { TimeslotItemsQueryAuthVisitor } from './timeslotItems.auth';

@InRequestScope
export class TimeslotItemsRepository extends RepositoryBase<TimeslotItem> {
	@Inject
	private userContext: UserContext;

	constructor() {
		super(TimeslotItem);
	}

	public async saveTimeslotItem(data: TimeslotItem): Promise<TimeslotItem> {
		if (!data) return null;
		const repository = await this.getRepository();
		return await repository.save(data);
	}

	public async saveTimeslotItems(data: TimeslotItem[]): Promise<TimeslotItem[]> {
		if (!data) return null;
		const repository = await this.getRepository();
		return await repository.save(data);
	}

	public async deleteTimeslotItem(id: number): Promise<DeleteResult> {
		const repository = await this.getRepository();
		return await repository.delete(id);
	}

	public async getTimeslotItem(request: TimeslotItemsSearchRequest): Promise<TimeslotItem> {
		const { id, byPassAuth } = request;
		if (!id) return null;
		const repository = await this.getRepository();
		const idCondition = '"timeslotItem"."_id" = :id';
		const authGroups = await this.userContext.getAuthGroups();
		const { userCondition, userParams } = byPassAuth
			? { userCondition: '', userParams: {} }
			: await new TimeslotItemsQueryAuthVisitor(
				'service',
				'serviceProvider',
				'SPservice',
			  ).createUserVisibilityCondition(authGroups);

		const query = repository
			.createQueryBuilder('timeslotItem')
			.where(
				[idCondition, userCondition]
					.filter((c) => c)
					.map((c) => `(${c})`)
					.join(' AND '),
				{ ...userParams, id: request.id },
			)
			.leftJoin('timeslotItem._timeslotsSchedule', 'timeslotsSchedule')
			.leftJoin('timeslotsSchedule._serviceProvider', 'serviceProvider')
			.leftJoin('timeslotsSchedule._service', 'service')
			.leftJoin('serviceProvider._service', 'SPservice');
		return await query.getOne();
	}

	public async deleteTimeslotsForSchedule(scheduleId: number): Promise<DeleteResult> {
		const repository = await this.getRepository();
		const query = repository
			.createQueryBuilder()
			.delete()
			.from(TimeslotItem)
			.where('_timeslotsScheduleId = :scheduleId', { scheduleId });

		return query.execute();
	}
}

export type TimeslotItemsSearchRequest = {
	id: number;
	byPassAuth?: boolean;
};
