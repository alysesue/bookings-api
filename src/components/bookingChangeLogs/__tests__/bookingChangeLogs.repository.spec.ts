import { Booking, BookingChangeLog, User } from '../../../models';
import { Container } from 'typescript-ioc';
import { UserContext } from '../../../infrastructure/userContext.middleware';
import { TransactionManager } from '../../../core/transactionManager';
import { BookingChangeLogsRepository } from '../bookingChangeLogs.repository';
import { ChangeLogAction } from '../../../models/entities/bookingChangeLog';

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
	Container.bind(UserContext).to(UserContextMock);
});

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('BookingChangeLogs repository', () => {
	const singpassUserMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');

	beforeEach(() => {
		jest.resetAllMocks();

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassUserMock));
	});

	it('should saveLog', async () => {
		const repo = Container.get(BookingChangeLogsRepository);

		const booking = new Booking();
		const changeLog = BookingChangeLog.create({
			booking,
			user: singpassUserMock,
			action: ChangeLogAction.Create,
			previousState: {},
			newState: {},
		});

		TransactionManagerMock.save.mockImplementation(() => Promise.resolve(changeLog));

		await repo.saveLog(changeLog);
		expect(TransactionManagerMock.save).toBeCalled();
	});
});

class TransactionManagerMock extends TransactionManager {
	public static insert = jest.fn();
	public static find = jest.fn();
	public static update = jest.fn();
	public static findOne = jest.fn();
	public static save = jest.fn();
	public static createQueryBuilder = jest.fn();

	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: () => ({
				find: TransactionManagerMock.find,
				findOne: TransactionManagerMock.findOne,
				insert: TransactionManagerMock.insert,
				update: TransactionManagerMock.update,
				save: TransactionManagerMock.save,
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
