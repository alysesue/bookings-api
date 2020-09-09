import { Container } from 'typescript-ioc';
import { TimeOfDay, TimeslotItem } from '../../../models';
import { TimeslotItemsRepository } from '../timeslotItems.repository';
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

describe('TimeslotItems repository', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should save TimeslotItem', async () => {
		const repository = Container.get(TimeslotItemsRepository);
		const data = TimeslotItem.create(1, 0, TimeOfDay.parse('08:00'), TimeOfDay.parse('09:00'));
		const result = await repository.saveTimeslotItem(data);
		expect(result).not.toBe(undefined);
		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.save).toBeCalledTimes(1);
	});

	it('should save TimeslotItems', async () => {
		const repository = Container.get(TimeslotItemsRepository);
		const data = TimeslotItem.create(1, 0, TimeOfDay.parse('08:00'), TimeOfDay.parse('09:00'));
		const result = await repository.saveTimeslotItems([data]);
		expect(result).not.toBe(undefined);
		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.save).toBeCalledTimes(1);
	});

	it('should delete timeslot', async () => {
		const repository = Container.get(TimeslotItemsRepository);
		await repository.deleteTimeslotItem(1);
		expect(InnerRepositoryMock.delete).toBeCalledTimes(1);
	});
});

const timeslotItemMock = TimeslotItem.create(
	1,
	1,
	TimeOfDay.create({ hours: 8, minutes: 0 }),
	TimeOfDay.create({ hours: 9, minutes: 0 }),
);

export const InnerRepositoryMock = {
	save: jest.fn().mockImplementation(() => {
		return Promise.resolve(timeslotItemMock);
	}),
	find: jest.fn().mockImplementation(() => {
		return Promise.resolve([timeslotItemMock]);
	}),
	delete: jest.fn().mockImplementationOnce((...id) => {
		return Promise.resolve([timeslotItemMock]);
	}),
};

export const GetRepositoryMock = jest.fn().mockImplementation(() => InnerRepositoryMock);

class TransactionManagerMock extends TransactionManager {
	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: GetRepositoryMock,
		};
		return Promise.resolve(entityManager);
	}
}
