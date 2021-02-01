import { BookingSearchQuery, BookingsRepository } from '../bookings.repository';
import { Booking, BookingStatus, ServiceProvider, User } from '../../../models';
import { Container } from 'typescript-ioc';
import { InsertResult } from 'typeorm';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { TransactionManager } from '../../../core/transactionManager';
import { BookingBuilder } from '../../../models/entities/booking';
import { AuthGroup, CitizenAuthGroup } from '../../../infrastructure/auth/authGroup';
import { ServiceProvidersRepository } from '../../../components/serviceProviders/serviceProviders.repository';
import { PagingHelper } from '../../../core/paging';
import { IPagedEntities } from '../../../core/pagedEntities';

jest.mock('../../../core/paging');

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
	Container.bind(UserContext).to(UserContextMock);
	Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
});

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

// tslint:disable-next-line: no-big-function
describe('Bookings repository', () => {
	const singpassUserMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');

	const queryBuilderMock = {
		where: jest.fn(),
		leftJoinAndSelect: jest.fn(),
		leftJoinAndMapOne: jest.fn(),
		orderBy: jest.fn(),
		getOne: jest.fn(),
	};

	PagingHelper.getManyWithPaging = jest.fn();

	beforeEach(() => {
		jest.resetAllMocks();

		(PagingHelper.getManyWithPaging as jest.Mock).mockImplementation(() =>
			Promise.resolve({ entries: [] } as IPagedEntities<Booking>),
		);

		queryBuilderMock.where.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.leftJoinAndSelect.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.leftJoinAndMapOne.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.orderBy.mockImplementation(() => queryBuilderMock);

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassUserMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new CitizenAuthGroup(singpassUserMock)]),
		);

		ServiceProvidersRepositoryMock.getServiceProviders.mockImplementation(() => Promise.resolve([]));
	});

	it('should search bookings with date range and access type', async () => {
		const bookingMock = new Booking();
		bookingMock.status = BookingStatus.Accepted;

		(PagingHelper.getManyWithPaging as jest.Mock).mockImplementation(() =>
			Promise.resolve({ entries: [bookingMock] } as IPagedEntities<Booking>),
		);

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const bookingsRepository = Container.get(BookingsRepository);

		const result = await bookingsRepository.search({
			serviceId: 1,
			serviceProviderId: 1,
			from: new Date(Date.UTC(2020, 0, 1, 14, 0)),
			to: new Date(Date.UTC(2020, 0, 1, 15, 0)),
		} as BookingSearchQuery);

		expect(result.entries).toStrictEqual([bookingMock]);
		expect(queryBuilderMock.where).toBeCalledWith(
			`((booking."_citizenUinFin" = :authorisedUinFin)) AND \
(booking."_serviceId" = :serviceId) AND (booking."_serviceProviderId" = :serviceProviderId) AND \
(booking."_endDateTime" > :from) AND (booking."_startDateTime" < :to)`,
			{
				authorisedUinFin: 'ABC1234',
				from: new Date('2020-01-01T14:00:00.000Z'),
				to: new Date('2020-01-01T15:00:00.000Z'),
				serviceId: 1,
				serviceProviderId: 1,
			},
		);
		expect(queryBuilderMock.leftJoinAndSelect).toBeCalledTimes(1);
		expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
		expect(PagingHelper.getManyWithPaging).toBeCalledTimes(1);
	});

	it('should search bookings with creation date range', async () => {
		const bookingMock = new Booking();
		bookingMock.status = BookingStatus.Accepted;

		(PagingHelper.getManyWithPaging as jest.Mock).mockImplementation(() =>
			Promise.resolve({ entries: [bookingMock] } as IPagedEntities<Booking>),
		);

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const bookingsRepository = Container.get(BookingsRepository);

		const result = await bookingsRepository.search({
			fromCreatedDate: new Date('2020-01-01T14:00:00.000Z'),
			toCreatedDate: new Date('2020-01-01T15:00:00.000Z'),
		} as BookingSearchQuery);

		expect(result.entries).toStrictEqual([bookingMock]);
		expect(queryBuilderMock.where).toBeCalledWith(
			`((booking."_citizenUinFin" = :authorisedUinFin)) AND (createdlog."_timestamp" > :fromCreatedDate) AND (createdlog."_timestamp" < :toCreatedDate)`,
			{
				authorisedUinFin: 'ABC1234',
				fromCreatedDate: new Date('2020-01-01T14:00:00.000Z'),
				toCreatedDate: new Date('2020-01-01T15:00:00.000Z'),
			},
		);

		expect(queryBuilderMock.leftJoinAndSelect).toBeCalledTimes(1);
		expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
		expect(PagingHelper.getManyWithPaging).toBeCalledTimes(1);
	});

	it('should search bookings with status', async () => {
		const bookingMock = new Booking();
		bookingMock.status = BookingStatus.Accepted;

		(PagingHelper.getManyWithPaging as jest.Mock).mockImplementation(() =>
			Promise.resolve({ entries: [bookingMock] } as IPagedEntities<Booking>),
		);

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const bookingsRepository = Container.get(BookingsRepository);

		const result = await bookingsRepository.search({
			serviceId: 1,
			serviceProviderId: 1,
			statuses: [BookingStatus.Accepted, BookingStatus.PendingApproval],
			from: new Date(Date.UTC(2020, 0, 1, 14, 0)),
			to: new Date(Date.UTC(2020, 0, 1, 15, 0)),
		} as BookingSearchQuery);

		expect(result.entries).toStrictEqual([bookingMock]);
		expect(queryBuilderMock.where).toBeCalled();
		expect(queryBuilderMock.leftJoinAndSelect).toBeCalledTimes(1);
		expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
		expect(PagingHelper.getManyWithPaging).toBeCalledTimes(1);
	});

	it('should search bookings with citizenUinFin', async () => {
		const bookingMock = new Booking();
		bookingMock.status = BookingStatus.Accepted;

		(PagingHelper.getManyWithPaging as jest.Mock).mockImplementation(() =>
			Promise.resolve({ entries: [bookingMock] } as IPagedEntities<Booking>),
		);

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const bookingsRepository = Container.get(BookingsRepository);

		const result = await bookingsRepository.search({
			serviceId: 1,
			serviceProviderId: 1,
			citizenUinFins: ['abc123', 'xyz456'],
			from: new Date(Date.UTC(2020, 0, 1, 14, 0)),
			to: new Date(Date.UTC(2020, 0, 1, 15, 0)),
		} as BookingSearchQuery);

		expect(result.entries).toStrictEqual([bookingMock]);
		expect(queryBuilderMock.where).toBeCalled();
		expect(queryBuilderMock.leftJoinAndSelect).toBeCalledTimes(1);
		expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
		expect(PagingHelper.getManyWithPaging).toBeCalledTimes(1);
	});

	it('should insert booking', async () => {
		const insertResult = new InsertResult();
		insertResult.identifiers = [{ id: 'abc' }];
		TransactionManagerMock.insert.mockImplementation(() => insertResult);

		const bookingsRepository = Container.get(BookingsRepository);
		const booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		booking.id = 1;

		const result = await bookingsRepository.insert(booking);
		expect(result.identifiers).toStrictEqual([{ id: 'abc' }]);
	});

	it('should update booking', async () => {
		const bookingsRepository = Container.get(BookingsRepository);
		const booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		booking.id = 1;

		TransactionManagerMock.save.mockImplementation(() => booking);
		TransactionManagerMock.query.mockImplementation(() => Promise.resolve([[], 1]));

		await bookingsRepository.update(booking);
		expect(TransactionManagerMock.save).toBeCalled();
	});

	it('should get booking', async () => {
		const booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		booking.id = 1;

		queryBuilderMock.getOne.mockImplementation(() => Promise.resolve(booking));
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const bookingsRepository = Container.get(BookingsRepository);
		const result = await bookingsRepository.getBooking(1);
		expect(result).toStrictEqual(booking);
	});

	it('should get booking with service provider', async () => {
		const booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		booking.id = 1;
		booking.serviceProviderId = 2;

		const serviceProvider = ServiceProvider.create('A', 1);
		serviceProvider.id = 2;

		queryBuilderMock.getOne.mockImplementation(() => Promise.resolve(booking));
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		ServiceProvidersRepositoryMock.getServiceProviders.mockImplementation(() => Promise.resolve([serviceProvider]));

		const bookingsRepository = Container.get(BookingsRepository);
		const result = await bookingsRepository.getBooking(1);
		expect(result).toStrictEqual(booking);
		expect(result.serviceProvider).toStrictEqual(serviceProvider);
	});
});

class TransactionManagerMock implements Partial<TransactionManager> {
	public static insert = jest.fn();
	public static find = jest.fn();
	public static update = jest.fn();
	public static findOne = jest.fn();
	public static save = jest.fn();
	public static query = jest.fn();
	public static createQueryBuilder = jest.fn();

	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: () => ({
				find: TransactionManagerMock.find,
				findOne: TransactionManagerMock.findOne,
				insert: TransactionManagerMock.insert,
				update: TransactionManagerMock.update,
				save: TransactionManagerMock.save,
				query: TransactionManagerMock.query,
				createQueryBuilder: TransactionManagerMock.createQueryBuilder,
			}),
		};
		return Promise.resolve(entityManager);
	}
}

class UserContextMock implements Partial<UserContext> {
	public static getCurrentUser = jest.fn<Promise<User>, any>();
	public static getAuthGroups = jest.fn<Promise<AuthGroup[]>, any>();

	public init() {}
	public async getCurrentUser(...params): Promise<any> {
		return await UserContextMock.getCurrentUser(...params);
	}

	public async getAuthGroups(...params): Promise<any> {
		return await UserContextMock.getAuthGroups(...params);
	}
}

class ServiceProvidersRepositoryMock implements Partial<ServiceProvidersRepository> {
	public static getServiceProviders = jest.fn<Promise<ServiceProvider[]>, any>();
	public async getServiceProviders(...params): Promise<any> {
		return await ServiceProvidersRepositoryMock.getServiceProviders(...params);
	}
}
