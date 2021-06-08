import { WeekDayBreakRepository } from '../weekdaybreak.repository';
import { Container } from 'typescript-ioc';
import { ScheduleForm, TimeOfDay, WeekDayBreak } from '../../../models';
import { Weekday } from '../../../enums/weekday';
import { DeleteResult } from 'typeorm';
import { TransactionManager } from '../../../core/transactionManager';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
});

describe('WeekDayBreak repository', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should get breaks for schedule', async () => {
		TransactionManagerMock.find.mockReturnValue(Promise.resolve([]));

		const service = Container.get(WeekDayBreakRepository);
		const result = await service.getBreaksForSchedules([1, 2, 3]);
		expect(result).toBeDefined();
	});

	it('should save breaks', async () => {
		const service = Container.get(WeekDayBreakRepository);
		const schedule = new ScheduleForm();
		const weekDayBreak = WeekDayBreak.create(
			Weekday.Monday,
			TimeOfDay.parse('11:30'),
			TimeOfDay.parse('12:30'),
			schedule,
		);

		TransactionManagerMock.save.mockReturnValue(Promise.resolve({}));

		const result = await service.save([weekDayBreak]);
		expect(result).toBeDefined();
	});

	it('should delete breaks for schedule', async () => {
		const execute = jest.fn(() => Promise.resolve({} as DeleteResult));

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => ({
			delete: jest.fn(() => ({
				from: jest.fn(() => ({
					where: jest.fn(() => ({
						execute,
					})),
				})),
			})),
		}));

		const service = Container.get(WeekDayBreakRepository);
		const result = await service.deleteBreaksForSchedule(1);
		expect(result).toBeDefined();
	});
});
