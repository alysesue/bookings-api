import { Event } from '../../models/entities/event';
import { RepositoryBase } from '../../core/repository';
import { Inject, InRequestScope } from 'typescript-ioc';
import { SelectQueryBuilder } from 'typeorm';
import { andWhere, orWhere } from '../../tools/queryConditions';
import { UserContext } from '../../infrastructure/auth/userContext';
import { EventQueryAuthVisitor } from './events.auth';
import { PagingHelper } from '../../core/paging';
import { IPagedEntities } from '../../core/pagedEntities';
import { PagingRequest } from '../../apicontract';
import { OneOffTimeslotsRepository } from '../oneOffTimeslots/oneOffTimeslots.repository';
import { DefaultIsolationLevel } from '../../core/transactionManager';
import { LabelOperationFiltering } from '../labels/label.enum';

@InRequestScope
export class EventsRepository extends RepositoryBase<Event> {
	@Inject
	private userContext: UserContext;
	@Inject
	private oneOffTimeslotsRepository: OneOffTimeslotsRepository;

	constructor() {
		super(Event);
	}

	private async createSelectQuery(
		queryFilters: string[],
		queryParams: {},
		options: {
			byPassAuth?: boolean;
			queryORFilters?: string[];
			queryORParams?: {};
		},
	): Promise<SelectQueryBuilder<Event>> {
		const authGroups = await this.userContext.getAuthGroups();
		const { queryORFilters = [], queryORParams = {} } = options;
		const { userCondition, userParams } = options.byPassAuth
			? { userCondition: '', userParams: {} }
			: await new EventQueryAuthVisitor('serviceProvider', 'SPservice').createUserVisibilityCondition(authGroups);
		const repository = await this.getRepository();

		let whereConditions = andWhere([userCondition, ...queryFilters]);
		whereConditions += orWhere(queryORFilters).length ? ' AND ' + orWhere(queryORFilters) : '';
		const whereParam = { ...userParams, ...queryParams, ...queryORParams };

		return repository
			.createQueryBuilder('event')
			.where(whereConditions, whereParam)
			.leftJoinAndSelect('event._oneOffTimeslots', 'oneOffTimeslots')
			.leftJoinAndSelect('oneOffTimeslots._serviceProvider', 'serviceProvider')
			.leftJoinAndSelect('serviceProvider._service', 'SPservice')
			.leftJoinAndSelect('event._service', 'service')
			.leftJoinAndSelect('event._labels', 'label');
	}

	public async save(event: Event): Promise<Event> {
		if (!event) return null;

		const repository = await this.getRepository();
		return this.transactionManager.runInTransaction(DefaultIsolationLevel, async () => {
			const oneOffTimeslots = event.oneOffTimeslots;
			event.oneOffTimeslots = [];

			event = await repository.save(event);
			oneOffTimeslots.forEach((slot) => (slot.eventId = event.id));
			const savedOneOffTimeslots = await this.oneOffTimeslotsRepository.save(oneOffTimeslots);
			event.oneOffTimeslots = savedOneOffTimeslots;
			return event;
		});
	}

	public async getById(request: { id: number; byPassAuth?: boolean }): Promise<Event> {
		const idCondition = 'event._id = :id';
		const query = await this.createSelectQuery([idCondition], { id: request.id }, request);

		return await query.getOne();
	}

	public async searchReturnAll(request: EventSearchQuery): Promise<Event[]> {
		const query = await this.searchQueryFormulation(request);
		const result = await query.getMany();

		return result;
	}

	public async search(request: EventSearchPagingQuery): Promise<IPagedEntities<Event>> {
		const query = await this.searchQueryFormulation(request);
		const result = await PagingHelper.getManyWithPaging(query, 'event._id', request);
		return result;
	}

	private async searchQueryFormulation(request: {
		byPassAuth?: boolean;
		serviceId?: number;
		serviceProviderIds?: number[];
		startDateTime?: Date;
		endDateTime?: Date;
		labelIds?: number[];
		isOneOffTimeslot?: boolean;
		labelOperationFiltering?: LabelOperationFiltering;
	}): Promise<SelectQueryBuilder<Event>> {
		const {
			serviceId,
			serviceProviderIds,
			startDateTime,
			endDateTime,
			labelIds,
			isOneOffTimeslot,
			labelOperationFiltering,
		} = request;
		const serviceCondition = serviceId ? '"serviceProvider"."_serviceId" = :serviceId' : '';
		const spCondition =
			serviceProviderIds && serviceProviderIds.length > 0
				? '"oneOffTimeslots"."_serviceProviderId" IN (:...serviceProviderIds)'
				: '';
		const startDateCondition = startDateTime ? '"oneOffTimeslots"."_endDateTime" > :startDateTime' : '';
		const endDateCondition = endDateTime ? '"oneOffTimeslots"."_startDateTime" < :endDateTime' : '';
		const isOneOffTimeslotCondition =
			typeof isOneOffTimeslot === 'boolean' ? '"event"."_isOneOffTimeslot" = :isOneOffTimeslot' : '';
		const labelsCondition = labelIds?.length
			? labelIds.map(
					(_, index) =>
						`event."_id" IN (SELECT "event_id" FROM event_label WHERE "label_id" = :label_${index})`,
			  )
			: [];

		const labelsParam = {};
		if (labelIds && labelIds.length > 0) {
			labelIds.forEach((labelId, index) => (labelsParam[`label_${index}`] = labelId));
		}

		let labelsANDConditions = [];
		let labelsORConditions = [];
		let labelsORParams = {};
		let labelsANDParams = {};

		if (labelOperationFiltering === LabelOperationFiltering.UNION) {
			labelsORConditions = labelsCondition;
			labelsORParams = labelsParam;
		} else {
			labelsANDConditions = labelsCondition;
			labelsANDParams = labelsParam;
		}

		const query = await this.createSelectQuery(
			[
				serviceCondition,
				spCondition,
				startDateCondition,
				endDateCondition,
				isOneOffTimeslotCondition,
				...labelsANDConditions,
			],
			{ serviceId, serviceProviderIds, startDateTime, endDateTime, isOneOffTimeslot, ...labelsANDParams },
			{ ...request, queryORFilters: labelsORConditions, queryORParams: labelsORParams },
		);

		return query.orderBy('oneOffTimeslots._startDateTime', 'ASC');
	}

	public async delete(event: Event): Promise<void> {
		const repository = await this.getRepository();
		await repository.delete(event.id);
	}
}

export type EventSearchPagingQuery = EventSearchQuery & PagingRequest;

export type EventSearchQuery = {
	byPassAuth?: boolean;
	serviceId?: number;
	serviceProviderIds?: number[];
	startDateTime?: Date;
	endDateTime?: Date;
	labelIds?: number[];
	isOneOffTimeslot?: boolean;
	labelOperationFiltering?: LabelOperationFiltering;
};
