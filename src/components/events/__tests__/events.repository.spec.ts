import { Container } from 'typescript-ioc';
import { TransactionManager } from '../../../core/transactionManager';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { EventsRepository } from '../events.repository';
import { Event, OneOffTimeslot, Organisation, User } from '../../../models';
import { SelectQueryBuilder } from 'typeorm';
import { OrganisationAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { EventQueryAuthVisitor } from '../events.auth';
import { UserConditionParams } from '../../../infrastructure/auth/authConditionCollection';

jest.mock('../events.auth');

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
		expect(
			queryBuilderMock.where,
		).toBeCalledWith(
			'("serviceProvider"."_serviceId" = :serviceId) AND ("oneOffTimeslots"."_serviceProviderId" IN (:...serviceProviderIds))',
			{ serviceId: 2, serviceProviderIds: [10, 11] },
		);
		expect(queryBuilderMock.getMany).toBeCalled();
	});

	it('should filter events by one-of-timeslots flag if defined', async () => {
		const repository = Container.get(EventsRepository);
		await repository.searchReturnAll({ serviceId: 2, serviceProviderIds: [10, 11], isOneOffTimeslot: false });
		expect(QueryAuthVisitorMock.createUserVisibilityCondition).toBeCalled();
		expect(
			queryBuilderMock.where,
		).toBeCalledWith(
			'("serviceProvider"."_serviceId" = :serviceId) AND ("oneOffTimeslots"."_serviceProviderId" IN (:...serviceProviderIds)) AND ("event"."_isOneOffTimeslot" = :isOneOffTimeslot)',
			{ serviceId: 2, serviceProviderIds: [10, 11], isOneOffTimeslot: false },
		);
		expect(queryBuilderMock.getMany).toBeCalled();
	});
});
