import { BookingsRepository } from '../bookings.repository';
import { Booking, BookingStatus, User } from '../../../models';
import { Container } from 'typescript-ioc';
import { InsertResult } from 'typeorm';
import { QueryAccessType } from '../../../core/repository';
import { UserContext } from '../../../infrastructure/userContext.middleware';
import { TransactionManager } from '../../../core/transactionManager';

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
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

	it('should search bookings', async () => {
		const bookingMock = new Booking();
		bookingMock.status = BookingStatus.Accepted;

		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([bookingMock])),
		};

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassUserMock));

		const bookingsRepository = Container.get(BookingsRepository);

		const result = await bookingsRepository.search({
			serviceId: 1,
			serviceProviderId: 1,
			statuses: [BookingStatus.Accepted],
			from: new Date(Date.UTC(2020, 0, 1, 14, 0)),
			to: new Date(Date.UTC(2020, 0, 1, 15, 0)),
			accessType: QueryAccessType.Read,
		});

		expect(result).toStrictEqual([bookingMock]);
		expect(queryBuilderMock.where).toBeCalled();
		expect(queryBuilderMock.leftJoinAndSelect).toBeCalledTimes(2);
		expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
		expect(queryBuilderMock.getMany).toBeCalledTimes(1);
	});

	it('should search bookings without status', async () => {
		const bookingMock = new Booking();
		bookingMock.status = BookingStatus.Accepted;
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([bookingMock])),
		};

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassUserMock));

		const bookingsRepository = Container.get(BookingsRepository);

		const result = await bookingsRepository.search({
			serviceId: 1,
			serviceProviderId: 1,
			from: new Date(Date.UTC(2020, 0, 1, 14, 0)),
			to: new Date(Date.UTC(2020, 0, 1, 15, 0)),
			accessType: QueryAccessType.Read,
		});

		expect(result).toStrictEqual([bookingMock]);
		expect(queryBuilderMock.where).toBeCalled();
		expect(queryBuilderMock.leftJoinAndSelect).toBeCalledTimes(2);
		expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
		expect(queryBuilderMock.getMany).toBeCalledTimes(1);
	});

	it('should insert booking', async () => {
		const insertResult = new InsertResult();
		insertResult.identifiers = [{ id: 'abc' }];
		TransactionManagerMock.insert.mockImplementation(() => insertResult);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassUserMock));

		const bookingsRepository = Container.get(BookingsRepository);
		const booking: Booking = Booking.create(1, new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00'));

		const result = await bookingsRepository.insert(booking);
		expect(result.identifiers).toStrictEqual([{ id: 'abc' }]);
	});

	it('should update booking', async () => {
		const bookingsRepository = Container.get(BookingsRepository);
		const booking: Booking = Booking.create(1, new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00'));
		TransactionManagerMock.save.mockImplementation(() => booking);
		TransactionManagerMock.query.mockImplementation(() => Promise.resolve([[], 1]));
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassUserMock));

		await bookingsRepository.update(booking);
		expect(TransactionManagerMock.save).toBeCalled();
	});

	it('should get booking', async () => {
		const booking = Booking.create(1, new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00'));

		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve(booking)),
		};

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassUserMock));

		const bookingsRepository = Container.get(BookingsRepository);
		const result = await bookingsRepository.getBooking(1);
		expect(result).toStrictEqual(booking);
	});
});

class TransactionManagerMock extends TransactionManager {
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

class UserContextMock extends UserContext {
	public static getCurrentUser = jest.fn();

	public init() {}
	public async getCurrentUser(...params): Promise<any> {
		return await UserContextMock.getCurrentUser(params);
	}
}
