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
		if (!request.id) return null;
		const repository = await this.getRepository();
		const idCondition = 'timeslotItem."_id" = :id';
		const authGroups = await this.userContext.getAuthGroups();
		const { userCondition, userParams } = request.byPassAuth
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
			.leftJoinAndSelect('timeslotItem._timeslotsSchedule', 'timeslotsSchedule')
			.leftJoinAndSelect('timeslotsSchedule._serviceProvider', 'serviceProvider')
			.leftJoinAndSelect('timeslotsSchedule._service', 'service')
			.leftJoinAndSelect('serviceProvider._service', 'SPservice');
		return await query.getOne();
	}
}

export type TimeslotItemsSearchRequest = {
	id: number;
	byPassAuth?: boolean;
};
