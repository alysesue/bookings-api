import { BookingSearchQuery, BookingsRepository } from '../bookings.repository';
import { Booking, BookingStatus, ServiceProvider, User } from '../../../models';
import { Container } from 'typescript-ioc';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { TransactionManager } from '../../../core/transactionManager';
import { BookingBuilder } from '../../../models/entities/booking';
import { AuthGroup, CitizenAuthGroup } from '../../../infrastructure/auth/authGroup';
import { ServiceProvidersRepository } from '../../serviceProviders/serviceProviders.repository';
import { PagingHelper } from '../../../core/paging';
import { IPagedEntities } from '../../../core/pagedEntities';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';
import * as uuid from 'uuid';
import { ServiceProvidersRepositoryMock } from '../../../components/serviceProviders/__mocks__/serviceProviders.repository.mock';
import { BookingQueryVisitorFactory, IBookingQueryVisitor } from '../bookings.auth';
import { UserConditionParams } from '../../../infrastructure/auth/authConditionCollection';

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
		getMany: jest.fn(),
	};

	PagingHelper.getManyWithPaging = jest.fn();
	BookingQueryVisitorFactory.getBookingQueryVisitor = jest.fn();
	const queryVisitor: IBookingQueryVisitor = {
		createUserVisibilityCondition: jest.fn(),
	};

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
		(BookingQueryVisitorFactory.getBookingQueryVisitor as jest.Mock).mockReturnValue(queryVisitor);
		(queryVisitor.createUserVisibilityCondition as jest.Mock).mockResolvedValue({
			userCondition: '',
			userParams: {},
		} as UserConditionParams);
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
			serviceProviderIds: [1],
			from: new Date(Date.UTC(2020, 0, 1, 14, 0)),
			to: new Date(Date.UTC(2020, 0, 1, 15, 0)),
		} as BookingSearchQuery);

		expect(result.entries).toStrictEqual([bookingMock]);
		expect(queryBuilderMock.where).toBeCalledWith(
			`(booking."_serviceId" = :serviceId) AND (booking."_serviceProviderId" IN (:...serviceProviderIds)) AND \
(booking."_endDateTime" > :from) AND (booking."_startDateTime" < :to)`,
			{
				from: new Date('2020-01-01T14:00:00.000Z'),
				to: new Date('2020-01-01T15:00:00.000Z'),
				serviceId: 1,
				serviceProviderIds: [1],
			},
		);
		expect(queryBuilderMock.leftJoinAndSelect).toBeCalled();
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
			`(createdlog."_timestamp" > :fromCreatedDate) AND (createdlog."_timestamp" < :toCreatedDate)`,
			{
				fromCreatedDate: new Date('2020-01-01T14:00:00.000Z'),
				toCreatedDate: new Date('2020-01-01T15:00:00.000Z'),
			},
		);

		expect(queryBuilderMock.leftJoinAndSelect).toBeCalled();
		expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
		expect(PagingHelper.getManyWithPaging).toBeCalledTimes(1);
	});

	it('should search bookings and return all', async () => {
		const bookingMock = new Booking();
		bookingMock.status = BookingStatus.Accepted;

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		(queryBuilderMock.getMany as jest.Mock).mockImplementation(() => Promise.resolve([bookingMock]));

		const bookingsRepository = Container.get(BookingsRepository);

		const result = await bookingsRepository.searchReturnAll({
			fromCreatedDate: new Date('2020-01-01T14:00:00.000Z'),
			toCreatedDate: new Date('2020-01-01T15:00:00.000Z'),
		} as BookingSearchQuery);

		expect(result).toStrictEqual([bookingMock]);
		expect(queryBuilderMock.getMany).toBeCalledTimes(1);
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
			serviceProviderIds: [1],
			statuses: [BookingStatus.Accepted, BookingStatus.PendingApproval],
			from: new Date(Date.UTC(2020, 0, 1, 14, 0)),
			to: new Date(Date.UTC(2020, 0, 1, 15, 0)),
		} as BookingSearchQuery);

		expect(result.entries).toStrictEqual([bookingMock]);
		expect(queryBuilderMock.where).toBeCalled();
		expect(queryBuilderMock.leftJoinAndSelect).toBeCalled();
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
			serviceProviderIds: [1],
			citizenUinFins: ['abc123', 'xyz456'],
			from: new Date(Date.UTC(2020, 0, 1, 14, 0)),
			to: new Date(Date.UTC(2020, 0, 1, 15, 0)),
		} as BookingSearchQuery);

		expect(result.entries).toStrictEqual([bookingMock]);
		expect(queryBuilderMock.where).toBeCalled();
		expect(queryBuilderMock.leftJoinAndSelect).toBeCalled();
		expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
		expect(PagingHelper.getManyWithPaging).toBeCalledTimes(1);
	});

	it('should search bookings with booking token', async () => {
		const bookingMock = new Booking();
		bookingMock.status = BookingStatus.Accepted;

		(PagingHelper.getManyWithPaging as jest.Mock).mockImplementation(() =>
			Promise.resolve({ entries: [bookingMock] } as IPagedEntities<Booking>),
		);

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const bookingsRepository = Container.get(BookingsRepository);

		const result = await bookingsRepository.search({
			serviceId: 1,
			serviceProviderIds: [1],
			bookingToken: '66623746-ca76-4406-8138-0ca7ab0486cc',
		} as BookingSearchQuery);

		expect(result.entries).toStrictEqual([bookingMock]);
		expect(queryBuilderMock.where).toBeCalled();
		expect(queryBuilderMock.leftJoinAndSelect).toBeCalled();
		expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
		expect(PagingHelper.getManyWithPaging).toBeCalledTimes(1);
	});

	it('should insert booking', async () => {
		const bookingsRepository = Container.get(BookingsRepository);
		const booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		booking.id = 1;
		TransactionManagerMock.save.mockImplementation(() => booking);

		await bookingsRepository.insert(booking);
		expect(TransactionManagerMock.save).toBeCalled();
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

	it('should get booking by uuid', async () => {
		const bookingUUID = uuid.v4();
		const booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		booking.id = 1;
		booking.uuid = bookingUUID;

		queryBuilderMock.getOne.mockImplementation(() => Promise.resolve(booking));
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const bookingsRepository = Container.get(BookingsRepository);
		const result = await bookingsRepository.getBookingByUUID(bookingUUID);
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

	it('should get booking by eventId', async () => {
		const eventId = 1;
		const booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		booking.id = 1;
		booking.eventId = 1;

		queryBuilderMock.getMany.mockImplementation(() => Promise.resolve(booking));
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const bookingsRepository = Container.get(BookingsRepository);
		const result = await bookingsRepository.getBookingsByEventId(eventId);
		expect(result).toStrictEqual(booking);
	});
});

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
