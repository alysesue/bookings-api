import { Container } from 'typescript-ioc';
import { TransactionManager } from '../../../core/transactionManager';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { EventsRepository } from '../events.repository';
import { Booking, Event, OneOffTimeslot, Organisation, User } from '../../../models';
import { SelectQueryBuilder } from 'typeorm';
import { OrganisationAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { EventQueryAuthVisitor } from '../events.auth';
import { UserConditionParams } from '../../../infrastructure/auth/authConditionCollection';
import { PagingHelper } from '../../../core/paging';
import { IPagedEntities } from '../../../core/pagedEntities';
import { OneOffTimeslotsRepository } from '../../oneOffTimeslots/oneOffTimeslots.repository';
import { LabelOperationFiltering } from '../../labels/label.enum';

jest.mock('../events.auth');
jest.mock('../../../core/paging');

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
	Container.bind(UserContext).to(UserContextMock);
});

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('Test event repository', () => {
	const QueryAuthVisitorMock = {
		createUserVisibilityCondition: jest.fn<Promise<UserConditionParams>, any>(),
	};

	const adminUserMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		agencyUserId: 'ABC1234',
		email: 'john@email.com',
		userName: 'JohnAdmin',
		name: 'John',
	});

	const organisation = new Organisation();
	organisation.id = 1;
	let queryBuilderMock;

	beforeEach(() => {
		jest.resetAllMocks();
		(EventQueryAuthVisitor as jest.Mock).mockImplementation(() => QueryAuthVisitorMock);
		QueryAuthVisitorMock.createUserVisibilityCondition.mockImplementation(() =>
			Promise.resolve({ userCondition: '', userParams: {} }),
		);

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminUserMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(adminUserMock, [organisation])]),
		);
		(PagingHelper.getManyWithPaging as jest.Mock).mockImplementation(() =>
			Promise.resolve({ entries: [] } as IPagedEntities<Booking>),
		);

		queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			leftJoin: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([])),
			getOne: jest.fn(() => Promise.resolve({})),
			orderBy: jest.fn(() => queryBuilderMock),
		} as unknown) as SelectQueryBuilder<OneOffTimeslot>;
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
	});

	it('Should call save when event', async () => {
		const eventRepository = Container.get(EventsRepository);
		await eventRepository.save({} as Event);
		expect(TransactionManagerMock.runInTransaction).toHaveBeenCalledTimes(1);
	});

	it('Should call save when undefined', async () => {
		const eventRepository = Container.get(EventsRepository);
		await eventRepository.save(undefined);
		expect(TransactionManagerMock.runInTransaction).not.toHaveBeenCalled();
	});

	it('Should call delete when delete', async () => {
		const eventRepository = Container.get(EventsRepository);
		await eventRepository.delete(new Event());
		expect(TransactionManagerMock.delete).toHaveBeenCalled();
	});

	it('Should call getOne when getById', async () => {
		const eventRepository = Container.get(EventsRepository);
		await eventRepository.getById({ id: 1 });
		expect(queryBuilderMock.where).toBeCalledWith('(event._id = :id)', {
			id: 1,
		});
		expect(queryBuilderMock.getOne).toHaveBeenCalled();
	});

	it('should search timeslots (with parameters)', async () => {
		const repository = Container.get(EventsRepository);
		await repository.searchReturnAll({ serviceId: 2, serviceProviderIds: [10, 11] });
		expect(QueryAuthVisitorMock.createUserVisibilityCondition).toBeCalled();
		expect(queryBuilderMock.where).toBeCalledWith(
			'("serviceProvider"."_serviceId" = :serviceId) AND ("oneOffTimeslots"."_serviceProviderId" IN (:...serviceProviderIds))',
			{
				serviceId: 2,
				serviceProviderIds: [10, 11],
				endDateTime: undefined,
				startDateTime: undefined,
				title: undefined,
			},
		);
		expect(queryBuilderMock.getMany).toBeCalled();
	});

	it('should filter events by one-of-timeslots flag if defined', async () => {
		const repository = Container.get(EventsRepository);
		await repository.searchReturnAll({ serviceId: 2, serviceProviderIds: [10, 11], isOneOffTimeslot: false });
		expect(QueryAuthVisitorMock.createUserVisibilityCondition).toBeCalled();
		expect(queryBuilderMock.where).toBeCalledWith(
			'("serviceProvider"."_serviceId" = :serviceId) AND ("oneOffTimeslots"."_serviceProviderId" IN (:...serviceProviderIds)) AND ("event"."_isOneOffTimeslot" = :isOneOffTimeslot)',
			{
				serviceId: 2,
				serviceProviderIds: [10, 11],
				isOneOffTimeslot: false,
				endDateTime: undefined,
				startDateTime: undefined,
				title: undefined,
			},
		);
		expect(queryBuilderMock.getMany).toBeCalled();
	});

	it('should filter events by labelIds and serviceProvider with searchReturnAll method', async () => {
		const repository = Container.get(EventsRepository);
		await repository.searchReturnAll({
			serviceId: 2,
			serviceProviderIds: [10, 11],
			labelIds: [1],
		});
		expect(queryBuilderMock.where).toBeCalledWith(
			'("serviceProvider"."_serviceId" = :serviceId) AND ("oneOffTimeslots"."_serviceProviderId" IN (:...serviceProviderIds)) AND ((event."_id" IN (SELECT "event_id" FROM event_label WHERE "label_id" = :label_0)))',
			{
				serviceId: 2,
				serviceProviderIds: [10, 11],
				label_0: 1,
				endDateTime: undefined,
				startDateTime: undefined,
				title: undefined,
			},
		);
		expect(queryBuilderMock.getMany).toBeCalled();
	});

	it('should filter events by labelIds with search method (default operation: intersection) ', async () => {
		const repository = Container.get(EventsRepository);
		await repository.search({
			serviceId: 2,
			page: 1,
			limit: 100,
			labelIds: [1, 4],
		});
		expect(
			queryBuilderMock.where,
		).toBeCalledWith(
			'("serviceProvider"."_serviceId" = :serviceId) AND ((event."_id" IN (SELECT "event_id" FROM event_label WHERE "label_id" = :label_0)) AND (event."_id" IN (SELECT "event_id" FROM event_label WHERE "label_id" = :label_1)))',
			{ serviceId: 2, label_0: 1, label_1: 4 },
		);
		expect(PagingHelper.getManyWithPaging as jest.Mock).toHaveBeenCalledTimes(1);
	});

	it('should filter events by labelIds with search method (operation: union) ', async () => {
		const repository = Container.get(EventsRepository);
		await repository.search({
			serviceId: 2,
			page: 1,
			limit: 100,
			labelIds: [1, 4],
			labelOperationFiltering: LabelOperationFiltering.UNION,
		});
		expect(
			queryBuilderMock.where,
		).toBeCalledWith(
			'("serviceProvider"."_serviceId" = :serviceId) AND ((event."_id" IN (SELECT "event_id" FROM event_label WHERE "label_id" = :label_0)) OR (event."_id" IN (SELECT "event_id" FROM event_label WHERE "label_id" = :label_1)))',
			{ serviceId: 2, label_0: 1, label_1: 4 },
		);
		expect(PagingHelper.getManyWithPaging as jest.Mock).toHaveBeenCalledTimes(1);
	});

	it('should search timeslots with labelId with union filter (OR)', async () => {
		const queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			leftJoin: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([])),
		} as unknown) as SelectQueryBuilder<OneOffTimeslot>;
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(OneOffTimeslotsRepository);
		await repository.search({
			serviceId: 2,
			labelIds: [1, 2],
			labelOperationFiltering: LabelOperationFiltering.UNION,
		});
		expect(queryBuilderMock.where).toBeCalledWith(
			'((SPservice._organisationId IN (:...authorisedOrganisationIds))) AND ("serviceProvider"."_serviceId" = :serviceId) AND ' +
				'((timeslot."_id" IN (SELECT "oneOffTimeslot_id" FROM oneofftimeslot_label WHERE "label_id" = :label_0)) OR ' +
				'(timeslot."_id" IN (SELECT "oneOffTimeslot_id" FROM oneofftimeslot_label WHERE "label_id" = :label_1)))',
			{
				authorisedOrganisationIds: [1],
				startDateTime: undefined,
				endDateTime: undefined,
				serviceProviderIds: undefined,
				serviceId: 2,
				label_0: 1,
				label_1: 2,
			},
		);
		expect(queryBuilderMock.getMany).toBeCalled();
	});

	it('should search and return with paging', async () => {
		const repository = Container.get(EventsRepository);
		await repository.search({ serviceId: 2, serviceProviderIds: [10, 11], page: 1, limit: 1 });
		expect(PagingHelper.getManyWithPaging as jest.Mock).toHaveBeenCalledTimes(1);
	});
});
