import { DbConnection } from '../../core/db.connection';
import { Container } from 'typescript-ioc';
import { TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../../models';
import { TimeslotsScheduleRepository } from '../timeslotsSchedule.repository';
import { TimeslotItemsRepository } from '../timeslotItems.repository';

beforeEach(() => {
	Container.bind(DbConnection).to(DbConnectionMock);
	jest.clearAllMocks();
});

describe('TimeslotItems repository', () => {
	it('should save TimeslotItems', async () => {
		const repository = Container.get(TimeslotItemsRepository);
		const data = TimeslotItem.create(1, 0, TimeOfDay.parse("08:00"), TimeOfDay.parse("09:00"));
		const result = await repository.saveTimeslotItem(data);
		expect(result).not.toBe(undefined);
		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.save).toBeCalledTimes(1);
	});

});

const timeslotItemMock = TimeslotItem.create(1, 1, TimeOfDay.create({ hours: 8, minutes: 0 }), TimeOfDay.create({ hours: 9, minutes: 0 }));

export const InnerRepositoryMock = {
	save: jest.fn().mockImplementation(() => {
		return Promise.resolve(timeslotItemMock);
	}),
};


export const GetRepositoryMock = jest.fn().mockImplementation(() => InnerRepositoryMock);


export const DbConnectionMock = jest.fn().mockImplementation(() => {
	const getConnection = () => {
		const connection = {
			getRepository: GetRepositoryMock,
		};

		return Promise.resolve(connection);
	};

	return { getConnection };
});
