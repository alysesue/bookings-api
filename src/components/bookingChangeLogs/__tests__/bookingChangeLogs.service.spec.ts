import {
	Booking,
	BookingChangeLog,
	BookingStatus,
	ChangeLogAction,
	Service,
	ServiceProvider,
	User,
} from '../../../models';
import { Container } from 'typescript-ioc';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { AsyncFunction, TransactionManager } from '../../../core/transactionManager';
import { BookingChangeLogsService } from '../bookingChangeLogs.service';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { BookingChangeLogsRepository } from '../bookingChangeLogs.repository';
import { ConcurrencyError } from '../../../errors/ConcurrencyError';
import { BookingBuilder } from '../../../models/entities/booking';
import { AuthGroup } from '../../../infrastructure/auth/authGroup';

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
	Container.bind(BookingChangeLogsRepository).to(BookingChangeLogsRepositoryMock);
	Container.bind(UserContext).to(UserContextMock);
});

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

// tslint:disable-next-line: no-big-function
describe('BookingChangeLogs service', () => {
	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
		agencyUserId: 'ABC12',
	});

	beforeEach(() => {
		jest.resetAllMocks();

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		TransactionManagerMock.runInTransaction.mockImplementation(
			async <T extends unknown>(_isolationLevel: IsolationLevel, asyncFunction: AsyncFunction<T>): Promise<T> =>
				await asyncFunction(),
		);
		BookingChangeLogsRepositoryMock.save.mockImplementation((_entry) => Promise.resolve(_entry));
	});

	it('should execute and save log', async () => {
		const service = new Service();
		service.id = 1;
		service.name = 'service';
		const booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00Z'))
			.withEndDateTime(new Date('2020-10-01T02:00:00Z'))
			.build();
		booking.service = service;

		const getBooking = jest.fn((_id: number) => Promise.resolve(booking));
		const action = jest.fn(
			(_booking: Booking): Promise<[ChangeLogAction, Booking]> => {
				_booking.citizenUinFin = 'ABCD';
				return Promise.resolve([ChangeLogAction.Update, _booking]);
			},
		);

		const svc = Container.get(BookingChangeLogsService);
		await svc.executeAndLogAction(1, getBooking, action);

		expect(TransactionManagerMock.runInTransaction).toBeCalled();
		expect(getBooking).toBeCalled();
		expect(action).toBeCalled();
		expect(BookingChangeLogsRepositoryMock.save).toBeCalledTimes(1);

		const changeLogParam = BookingChangeLogsRepositoryMock.save.mock.calls[0][0] as BookingChangeLog;
		expect(changeLogParam.previousState).toEqual({
			startDateTime: new Date('2020-10-01T01:00:00Z'),
			endDateTime: new Date('2020-10-01T02:00:00Z'),
			citizenEmail: undefined,
			citizenName: undefined,
			citizenPhone: undefined,
			citizenUinFin: undefined,
			description: undefined,
			id: undefined,
			location: undefined,
			schemaVersion: 1,
			serviceId: 1,
			serviceName: 'service',
			status: 1,
		});
		expect(changeLogParam.newState).toEqual({
			startDateTime: new Date('2020-10-01T01:00:00Z'),
			endDateTime: new Date('2020-10-01T02:00:00Z'),
			citizenEmail: undefined,
			citizenName: undefined,
			citizenPhone: undefined,
			citizenUinFin: 'ABCD',
			description: undefined,
			id: undefined,
			location: undefined,
			schemaVersion: 1,
			serviceId: 1,
			serviceName: 'service',
			status: 1,
		});
	});

	it('should execute and save log with service provider', async () => {
		const service = new Service();
		service.id = 1;
		service.name = 'service';
		const booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00Z'))
			.withEndDateTime(new Date('2020-10-01T02:00:00Z'))
			.build();
		booking.service = service;

		const serviceProvider = ServiceProvider.create('J', 1, 'sp@email.com', '010000000');
		serviceProvider.id = 1;
		serviceProvider.linkedUser = adminMock;

		const getBooking = jest.fn((_id: number) => Promise.resolve(booking));
		const action = jest.fn(
			(_booking: Booking): Promise<[ChangeLogAction, Booking]> => {
				_booking.serviceProvider = serviceProvider;
				_booking.serviceProviderId = serviceProvider.id;
				return Promise.resolve([ChangeLogAction.Update, _booking]);
			},
		);

		const svc = Container.get(BookingChangeLogsService);
		await svc.executeAndLogAction(1, getBooking, action);

		expect(TransactionManagerMock.runInTransaction).toBeCalled();
		expect(getBooking).toBeCalled();
		expect(action).toBeCalled();
		expect(BookingChangeLogsRepositoryMock.save).toBeCalledTimes(1);

		const changeLogParam = BookingChangeLogsRepositoryMock.save.mock.calls[0][0] as BookingChangeLog;
		expect(changeLogParam.previousState).toEqual({
			startDateTime: new Date('2020-10-01T01:00:00Z'),
			endDateTime: new Date('2020-10-01T02:00:00Z'),
			citizenEmail: undefined,
			citizenName: undefined,
			citizenPhone: undefined,
			citizenUinFin: undefined,
			description: undefined,
			id: undefined,
			location: undefined,
			schemaVersion: 1,
			serviceId: 1,
			serviceName: 'service',
			status: 1,
		});
		expect(changeLogParam.newState).toEqual({
			startDateTime: new Date('2020-10-01T01:00:00Z'),
			endDateTime: new Date('2020-10-01T02:00:00Z'),
			citizenEmail: undefined,
			citizenName: undefined,
			citizenPhone: undefined,
			citizenUinFin: undefined,
			description: undefined,
			id: undefined,
			location: undefined,
			schemaVersion: 1,
			serviceId: 1,
			serviceName: 'service',
			status: 1,
			serviceProviderAgencyUserId: 'ABC12',
			serviceProviderEmail: 'sp@email.com',
			serviceProviderId: 1,
			serviceProviderName: 'J',
			serviceProviderPhone: '010000000',
		});
	});

	it('should throw when service is not loaded', async () => {
		const booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();

		const getBooking = jest.fn((_id: number) => Promise.resolve(booking));
		const action = jest.fn(
			(_booking: Booking): Promise<[ChangeLogAction, Booking]> => {
				_booking.citizenUinFin = 'ABCD';
				return Promise.resolve([ChangeLogAction.Update, _booking]);
			},
		);

		const svc = Container.get(BookingChangeLogsService);
		const asyncTest = async () => await svc.executeAndLogAction(1, getBooking, action);

		await expect(asyncTest).rejects.toThrowErrorMatchingInlineSnapshot(`"Booking.service not loaded in memory"`);
	});

	it('should throw when service provider is not loaded', async () => {
		const service = new Service();
		service.id = 1;
		service.name = 'service';
		const booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		booking.service = service;
		booking.status = BookingStatus.Accepted;
		booking.serviceProviderId = 2;

		const getBooking = jest.fn((_id: number) => Promise.resolve(booking));
		const action = jest.fn(
			(_booking: Booking): Promise<[ChangeLogAction, Booking]> => {
				_booking.citizenUinFin = 'ABCD';
				return Promise.resolve([ChangeLogAction.Update, _booking]);
			},
		);

		const svc = Container.get(BookingChangeLogsService);
		const asyncTest = async () => await svc.executeAndLogAction(1, getBooking, action);

		await expect(asyncTest).rejects.toThrowErrorMatchingInlineSnapshot(
			`"Booking.serviceProvider not loaded in memory"`,
		);
	});

	it('should retry on concurrency exception', async () => {
		const service = new Service();
		service.id = 1;
		service.name = 'service';
		const booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		booking.service = service;

		const getBooking = jest.fn((_id: number) => Promise.resolve(booking));
		const firstAction = jest.fn(
			(_booking: Booking): Promise<[ChangeLogAction, Booking]> => {
				throw new ConcurrencyError(`Some concurrency error`);
			},
		);
		const retryAction = jest.fn(
			(_booking: Booking): Promise<[ChangeLogAction, Booking]> => {
				_booking.citizenUinFin = 'ABCD';
				return Promise.resolve([ChangeLogAction.Update, _booking]);
			},
		);

		let counter = 0;
		const action = jest.fn(
			async (_booking: Booking): Promise<[ChangeLogAction, Booking]> => {
				return counter++ === 0 ? await firstAction(_booking) : await retryAction(_booking);
			},
		);

		const svc = Container.get(BookingChangeLogsService);
		await svc.executeAndLogAction(1, getBooking, action);

		expect(action).toBeCalled();
		expect(firstAction).toBeCalled();
		expect(retryAction).toBeCalled();
	});

	it('should not retry on unexpected exception', async () => {
		const service = new Service();
		service.id = 1;
		service.name = 'service';
		const booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		booking.service = service;

		const getBooking = jest.fn((_id: number) => Promise.resolve(booking));
		const firstAction = jest.fn(
			(_booking: Booking): Promise<[ChangeLogAction, Booking]> => {
				throw new Error(`Some unknown error`);
			},
		);
		const retryAction = jest.fn(
			(_booking: Booking): Promise<[ChangeLogAction, Booking]> => {
				_booking.citizenUinFin = 'ABCD';
				return Promise.resolve([ChangeLogAction.Update, _booking]);
			},
		);

		let counter = 0;
		const action = jest.fn(
			async (_booking: Booking): Promise<[ChangeLogAction, Booking]> => {
				return counter++ === 0 ? await firstAction(_booking) : await retryAction(_booking);
			},
		);

		const svc = Container.get(BookingChangeLogsService);
		const asyncTest = async () => await svc.executeAndLogAction(1, getBooking, action);

		await expect(asyncTest).rejects.toThrowErrorMatchingInlineSnapshot(`"Some unknown error"`);

		expect(action).toBeCalled();
		expect(firstAction).toBeCalled();
		expect(retryAction).not.toBeCalled();
	});

	it('should get logs', async () => {
		const changedSince = new Date(Date.UTC(2020, 0, 1, 14, 0));
		const changedUntil = new Date(Date.UTC(2020, 0, 31, 14, 0));
		BookingChangeLogsRepositoryMock.getLogs.mockImplementation(() => Promise.resolve(new Map()));

		const svc = Container.get(BookingChangeLogsService);
		await svc.getLogs({ changedSince, changedUntil, bookingIds: [2, 3], serviceId: 1 });
		expect(BookingChangeLogsRepositoryMock.getLogs).toBeCalled();
	});
});

class TransactionManagerMock extends TransactionManager {
	public static runInTransaction = jest.fn();

	public async runInTransaction(...params): Promise<any> {
		await TransactionManagerMock.runInTransaction(...params);
	}
}

class UserContextMock extends UserContext {
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

class BookingChangeLogsRepositoryMock extends BookingChangeLogsRepository {
	public static save = jest.fn();
	public static getLogs = jest.fn<Promise<Map<number, BookingChangeLog[]>>, any>();

	public async save(...params): Promise<any> {
		await BookingChangeLogsRepositoryMock.save(...params);
	}

	public async getLogs(...params): Promise<any> {
		await BookingChangeLogsRepositoryMock.getLogs(...params);
	}
}
