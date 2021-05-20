import { Container } from 'typescript-ioc';
import { BookingChangeLogsService } from '../bookingChangeLogs.service';
import { BookingChangeLogsController } from '../bookingChangeLogs.controller';
import { BookingChangeLog, ChangeLogAction, ServiceProvider, User } from '../../../models';
import { BookingBuilder } from '../../../models/entities/booking';
import { groupByKey } from '../../../tools/collections';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

jest.mock('mol-lib-common', () => {
	const actual = jest.requireActual('mol-lib-common');
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const mock = (config: any) => {
		return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => descriptor;
	};
	return {
		...actual,
		MOLAuth: mock,
	};
});

describe('BookingChangeLogs controller', () => {
	beforeAll(() => {
		Container.bind(BookingChangeLogsService).to(BookingChangeLogsServiceMock);
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
			previousState: { citizenName: 'a', citizenEmail: 'b@email.com' },
			newState: { citizenName: 'c' },
		});
		log.timestamp = new Date(Date.UTC(2020, 0, 1, 14, 0));

		const dataLogs = [log];

		BookingChangeLogsServiceMock.getLogs.mockImplementation(() =>
			Promise.resolve(groupByKey(dataLogs, (e) => e.booking.id)),
		);

		const result = await controller.getChangeLogs(changedSince, changedUntil, [2, 3], 1);
		expect(result).toMatchSnapshot();
	});
});

class BookingChangeLogsServiceMock implements Partial<BookingChangeLogsService> {
	public static getLogs = jest.fn<Promise<Map<number, BookingChangeLog[]>>, any>();

	public async getLogs(...params): Promise<any> {
		return await BookingChangeLogsServiceMock.getLogs(...params);
	}
}
