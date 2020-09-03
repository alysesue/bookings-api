import { CalendarsRepository } from '../calendars.repository';
import { Container } from 'typescript-ioc';
import { Calendar } from '../../../models';
import { TransactionManager } from '../../../core/transactionManager';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
});

beforeEach(() => {
	jest.clearAllMocks();
});

describe('Calendar repository', () => {
	it('should get calendars', async () => {
		const calendarsRepository = Container.get(CalendarsRepository);
		const result = await calendarsRepository.getCalendars();
		expect(result).not.toBe(undefined);

		expect(getRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.find).toBeCalledTimes(1);
	});

	it('should get calendar by UUID', async () => {
		const calendarsRepository = Container.get(CalendarsRepository);
		const result = await calendarsRepository.getCalendarByUUID('uuid');
		expect(result).not.toBe(undefined);

		expect(getRepositoryMock).toBeCalled();
	});

	it('should save calendars', async () => {
		const calendarsRepository = Container.get(CalendarsRepository);
		const myCalendar = { uuid: 'uuid' } as Calendar;

		const result = await calendarsRepository.saveCalendar(myCalendar);
		expect(result).not.toBe(undefined);

		expect(getRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.save).toBeCalledTimes(1);
	});
});

const InnerRepositoryMock = {
	find: jest.fn().mockImplementation(() => Promise.resolve([])),
	save: jest.fn().mockImplementation(() => Promise.resolve({})),
	findOne: jest.fn().mockImplementation(() => Promise.resolve({}))
};

const getRepositoryMock = jest.fn().mockImplementation(() => InnerRepositoryMock);

class TransactionManagerMock extends TransactionManager {
	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: getRepositoryMock,
		};
		return Promise.resolve(entityManager);
	}
}
