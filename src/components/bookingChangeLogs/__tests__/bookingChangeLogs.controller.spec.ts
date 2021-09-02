import { Container } from 'typescript-ioc';
import { BookingChangeLogsService } from '../bookingChangeLogs.service';
import { BookingChangeLogsController, BookingChangeLogsControllerV2 } from '../bookingChangeLogs.controller';
import { BookingChangeLog, ChangeLogAction, ServiceProvider, User } from '../../../models';
import { BookingBuilder } from '../../../models/entities/booking';
import { groupByKey } from '../../../tools/collections';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';

jest.mock('../bookingChangeLogs.service', () => {
	class BookingChangeLogsService {}
	return { BookingChangeLogsService };
});
jest.mock('../../../infrastructure/idHasher', () => {
	class IdHasher {}
	return { IdHasher };
});

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('BookingChangeLogs Controller V1', () => {
	beforeAll(() => {
		Container.bind(BookingChangeLogsService).to(BookingChangeLogsServiceMock);
		Container.bind(IdHasher).to(IdHasherMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();

		IdHasherMock.encode.mockImplementation((id: number) => id.toString());
		IdHasherMock.decode.mockImplementation((id: string) => Number.parseInt(id, 10));
	});

	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
		agencyUserId: 'ABC123',
	});

	const booking = new BookingBuilder()
		.withServiceId(1)
		.withStartDateTime(new Date(Date.UTC(2020, 0, 1, 14, 0)))
		.withEndDateTime(new Date(Date.UTC(2020, 0, 1, 15, 0)))
		.build();
	booking.id = 1;
	booking.serviceProvider = ServiceProvider.create('name', 1, 'ad@as.com', '800 120 7163');

	it('should get logs', async () => {
		const controller = Container.get(BookingChangeLogsController);
		const changedSince = new Date(Date.UTC(2020, 0, 1, 14, 0));
		const changedUntil = new Date(Date.UTC(2020, 0, 31, 14, 0));

		const log = BookingChangeLog.create({
			booking,
			user: adminMock,
			action: ChangeLogAction.Create,
			previousState: {
				id: 123,
				serviceId: 1,
				serviceProviderId: 8,
				citizenName: 'a',
				citizenEmail: 'b@email.com',
				videoConferenceUrl: 'https://a.com',
				refId: 'abc1',
			},
			newState: {
				id: 123,
				serviceId: 1,
				serviceProviderId: 8,
				citizenName: 'c',
				citizenEmail: 'b@email.com',
				videoConferenceUrl: 'https://a.com',
				refId: 'abc1',
			},
		});
		log.timestamp = new Date(Date.UTC(2020, 0, 1, 14, 0));

		const dataLogs = [log];

		BookingChangeLogsServiceMock.getLogs.mockImplementation(() =>
			Promise.resolve(groupByKey(dataLogs, (e) => e.booking.id)),
		);

		const result = await controller.getChangeLogs(changedSince, changedUntil, [2, 3], 1);
		expect(result).toEqual({
			data: [
				{
					bookingId: 1,
					changeLogs: [
						{
							action: 'create',
							changes: {
								citizenName: 'c',
							},
							previousBooking: {
								id: 123,
								serviceId: 1,
								serviceProviderId: 8,
								citizenEmail: 'b@email.com',
								citizenName: 'a',
								videoConferenceUrl: 'https://a.com',
								refId: 'abc1',
								schemaVersion: 1,
							},
							timestamp: new Date('2020-01-01T14:00:00.000Z'),
							user: {
								admin: {
									agencyUserId: 'ABC123',
									email: 'test@email.com',
									name: 'Name',
								},
								userType: 'admin',
							},
						},
					],
				},
			],
		});
	});
});

describe('BookingChangeLogs Controller V2', () => {
	beforeAll(() => {
		Container.bind(BookingChangeLogsService).to(BookingChangeLogsServiceMock);
		Container.bind(IdHasher).to(IdHasherMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();

		IdHasherMock.encode.mockImplementation((id: number) => id.toString());
		IdHasherMock.decode.mockImplementation((id: string) => Number.parseInt(id, 10));
	});

	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
		agencyUserId: 'ABC123',
	});

	const booking = new BookingBuilder()
		.withServiceId(1)
		.withStartDateTime(new Date(Date.UTC(2020, 0, 1, 14, 0)))
		.withEndDateTime(new Date(Date.UTC(2020, 0, 1, 15, 0)))
		.build();
	booking.id = 1;
	booking.serviceProvider = ServiceProvider.create('name', 1, 'ad@as.com', '800 120 7163');

	it('should get logs', async () => {
		const controller = Container.get(BookingChangeLogsControllerV2);
		const changedSince = new Date(Date.UTC(2020, 0, 1, 14, 0));
		const changedUntil = new Date(Date.UTC(2020, 0, 31, 14, 0));

		const log = BookingChangeLog.create({
			booking,
			user: adminMock,
			action: ChangeLogAction.Create,
			previousState: {
				id: 123,
				serviceId: 1,
				serviceProviderId: 8,
				citizenName: 'a',
				citizenEmail: 'b@email.com',
				videoConferenceUrl: 'https://a.com',
				refId: 'abc1',
			},
			newState: {
				id: 123,
				serviceId: 1,
				serviceProviderId: 8,
				citizenName: 'c',
				citizenEmail: 'b@email.com',
				videoConferenceUrl: 'https://a.com',
				refId: 'abc1',
			},
		});
		log.timestamp = new Date(Date.UTC(2020, 0, 1, 14, 0));

		const dataLogs = [log];

		BookingChangeLogsServiceMock.getLogs.mockImplementation(() =>
			Promise.resolve(groupByKey(dataLogs, (e) => e.booking.id)),
		);

		const result = await controller.getChangeLogs(changedSince, changedUntil, ['1'], '39t2m');
		expect(result).toEqual({
			data: [
				{
					bookingId: '1',
					changeLogs: [
						{
							action: 'create',
							changes: {
								citizenName: 'c',
							},
							previousBooking: {
								id: '123',
								serviceId: '1',
								serviceProviderId: '8',
								citizenEmail: 'b@email.com',
								citizenName: 'a',
								videoConferenceUrl: 'https://a.com',
								refId: 'abc1',
								schemaVersion: 1,
							},
							timestamp: new Date('2020-01-01T14:00:00.000Z'),
							user: {
								admin: {
									agencyUserId: 'ABC123',
									email: 'test@email.com',
									name: 'Name',
								},
								userType: 'admin',
							},
						},
					],
				},
			],
		});
	});
});

class BookingChangeLogsServiceMock implements Partial<BookingChangeLogsService> {
	public static getLogs = jest.fn<Promise<Map<number, BookingChangeLog[]>>, any>();

	public async getLogs(...params): Promise<any> {
		return await BookingChangeLogsServiceMock.getLogs(...params);
	}
}
