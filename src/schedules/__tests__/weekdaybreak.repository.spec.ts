import { WeekDayBreakRepository } from '../weekdaybreak.repository';
import { DbConnection } from '../../core/db.connection';
import { Container, Snapshot } from 'typescript-ioc';
import { Schedule, TimeOfDay, WeekDayBreak } from "../../models";
import { CreateQueryBuilder, DbConnectionMock } from '../../infrastructure/tests/dbconnectionmock';
import { Weekday } from '../../enums/weekday';
import { DeleteResult } from 'typeorm';

let snapshot: Snapshot;
beforeAll(() => {
	// Store the IoC configuration
	snapshot = Container.snapshot();

	// Clears mock counters, not implementation
	jest.clearAllMocks();
});

afterAll(() => {
	// Put the IoC configuration back, so other tests can run.
	snapshot.restore();
});

beforeEach(() => {
	Container.bind(DbConnection).to(DbConnectionMock);

	jest.clearAllMocks();
});

describe('Schedule repository', () => {
	it('should get breaks for schedule', async () => {
		const service = Container.get(WeekDayBreakRepository);
		const result = await service.getBreaksForSchedules([1, 2, 3]);
		expect(result).toBeDefined();
	});

	it('should save breaks', async () => {
		const service = Container.get(WeekDayBreakRepository);
		const schedule = new Schedule();
		const weekDayBreak = WeekDayBreak.create(Weekday.Monday, TimeOfDay.parse('11:30'), TimeOfDay.parse('12:30'), schedule);

		const result = await service.save([weekDayBreak]);
		expect(result).toBeDefined();
	});

	it('should delete breaks for schedule', async () => {
		const execute = jest.fn(() => Promise.resolve(new DeleteResult()));

		CreateQueryBuilder.mockImplementation(() => ({
			delete: jest.fn(() => ({
				from: jest.fn(() => ({
					where: jest.fn(() => ({
						execute
					}))
				}))
			}))
		}));

		const service = Container.get(WeekDayBreakRepository);
		const result = await service.deleteBreaksForSchedule(1);
		expect(result).toBeDefined();
	});
});
