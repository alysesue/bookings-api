import { CalendarsRepository } from '../calendars.repository';
import { Container } from 'typescript-ioc';
import { Calendar } from '../../../models/entities/calendar';
import { TransactionManager } from '../../../core/transactionManager';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
});

beforeEach(() => {
	jest.resetAllMocks();
});

describe('Calendar repository', () => {
	it('should get calendars', async () => {
		TransactionManagerMock.find.mockReturnValue(Promise.resolve([]));

		const calendarsRepository = Container.get(CalendarsRepository);
		const result = await calendarsRepository.getCalendars();
		expect(result).not.toBe(undefined);

		expect(TransactionManagerMock.find).toBeCalledTimes(1);
	});

	it('should get calendar by UUID', async () => {
		TransactionManagerMock.findOne.mockReturnValue(Promise.resolve({}));

		const calendarsRepository = Container.get(CalendarsRepository);
		const result = await calendarsRepository.getCalendarByUUID('uuid');
		expect(result).not.toBe(undefined);
	});

	it('should save calendars', async () => {
		TransactionManagerMock.save.mockReturnValue(Promise.resolve({}));

		const calendarsRepository = Container.get(CalendarsRepository);
		const myCalendar = { uuid: 'uuid' } as Calendar;

		const result = await calendarsRepository.saveCalendar(myCalendar);
		expect(result).not.toBe(undefined);

		expect(TransactionManagerMock.save).toBeCalledTimes(1);
	});
});
