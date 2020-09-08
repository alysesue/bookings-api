import { BookingsRepository } from '../bookings.repository';
import { DbConnection } from '../../../core/db.connection';
import { Booking, BookingStatus, User } from '../../../models';
import { Container } from 'typescript-ioc';
import { InsertResult } from 'typeorm';
import { QueryAccessType } from '../../../core/repository';
import { UserContext } from '../../../infrastructure/userContext.middleware';
import { BookingSearchRequest } from '../bookings.apicontract';
import { BookingBuilder } from '../../../models/entities/booking';

beforeAll(() => {
	Container.bind(DbConnection).to(MockDBConnection);
	Container.bind(UserContext).to(UserContextMock);
});

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('Bookings repository', () => {
	const singpassUserMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should search bookings with date range and access type', async () => {
		const bookingMock = new Booking();
		bookingMock.status = BookingStatus.Accepted;

		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([bookingMock])),
		};

		MockDBConnection.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassUserMock));

		const bookingsRepository = Container.get(BookingsRepository);

		const result = await bookingsRepository.search(
			{
				serviceId: 1,
				serviceProviderId: 1,
				from: new Date(Date.UTC(2020, 0, 1, 14, 0)),
				to: new Date(Date.UTC(2020, 0, 1, 15, 0)),
			} as BookingSearchRequest,
			QueryAccessType.Read,
		);

		expect(result).toStrictEqual([bookingMock]);
		expect(queryBuilderMock.where).toBeCalled();
		expect(queryBuilderMock.leftJoinAndSelect).toBeCalledTimes(2);
		expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
		expect(queryBuilderMock.getMany).toBeCalledTimes(1);
	});

	it('should search bookings with status', async () => {
		const bookingMock = new Booking();
		bookingMock.status = BookingStatus.Accepted;
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([bookingMock])),
		};

		MockDBConnection.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassUserMock));

		const bookingsRepository = Container.get(BookingsRepository);

		const result = await bookingsRepository.search(
			{
				serviceId: 1,
				serviceProviderId: 1,
				statuses: [BookingStatus.Accepted, BookingStatus.PendingApproval],
				from: new Date(Date.UTC(2020, 0, 1, 14, 0)),
				to: new Date(Date.UTC(2020, 0, 1, 15, 0)),
			} as BookingSearchRequest,
			QueryAccessType.Read,
		);

		expect(result).toStrictEqual([bookingMock]);
		expect(queryBuilderMock.where).toBeCalled();
		expect(queryBuilderMock.leftJoinAndSelect).toBeCalledTimes(2);
		expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
		expect(queryBuilderMock.getMany).toBeCalledTimes(1);
	});

	it('should search bookings with citizenUinFin', async () => {
		const bookingMock = new Booking();
		bookingMock.status = BookingStatus.Accepted;
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([bookingMock])),
		};

		MockDBConnection.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassUserMock));

		const bookingsRepository = Container.get(BookingsRepository);

		const result = await bookingsRepository.search(
			{
				serviceId: 1,
				serviceProviderId: 1,
				citizenUinFins: ['abc123', 'xyz456'],
				from: new Date(Date.UTC(2020, 0, 1, 14, 0)),
				to: new Date(Date.UTC(2020, 0, 1, 15, 0)),
			} as BookingSearchRequest,
			QueryAccessType.Read,
		);

		expect(result).toStrictEqual([bookingMock]);
		expect(queryBuilderMock.where).toBeCalled();
		expect(queryBuilderMock.leftJoinAndSelect).toBeCalledTimes(2);
		expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
		expect(queryBuilderMock.getMany).toBeCalledTimes(1);
	});

	it('should save booking', async () => {
		const insertResult = new InsertResult();
		insertResult.identifiers = [{ id: 'abc' }];
		MockDBConnection.insert.mockImplementation(() => insertResult);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassUserMock));

		const bookingsRepository = Container.get(BookingsRepository);
		const booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();

		const result = await bookingsRepository.save(booking);
		expect(result.identifiers).toStrictEqual([{ id: 'abc' }]);
	});

	it('should update booking', async () => {
		const bookingsRepository = Container.get(BookingsRepository);
		const booking: Booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		MockDBConnection.save.mockImplementation(() => booking);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassUserMock));

		await bookingsRepository.update(booking);
		expect(MockDBConnection.save).toBeCalled();
	});

	it('should get booking', async () => {
		const booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();

		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve(booking)),
		};

		MockDBConnection.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassUserMock));

		const bookingsRepository = Container.get(BookingsRepository);
		const result = await bookingsRepository.getBooking(1);
		expect(result).toStrictEqual(booking);
	});
});

class MockDBConnection extends DbConnection {
	public static insert = jest.fn();
	public static find = jest.fn();
	public static update = jest.fn();
	public static findOne = jest.fn();
	public static save = jest.fn();
	public static createQueryBuilder = jest.fn();

	public async getConnection(): Promise<any> {
		const connection = {
			getRepository: () => ({
				find: MockDBConnection.find,
				findOne: MockDBConnection.findOne,
				insert: MockDBConnection.insert,
				update: MockDBConnection.update,
				save: MockDBConnection.save,
				createQueryBuilder: MockDBConnection.createQueryBuilder,
			}),
		};
		return Promise.resolve(connection);
	}
}

class UserContextMock extends UserContext {
	public static getCurrentUser = jest.fn();

	public init() {}

	public async getCurrentUser(...params): Promise<any> {
		return await UserContextMock.getCurrentUser(params);
	}
}
